"use client";

import {
  Badge,
  BadgeCheck,
  IdCard,
  Loader2,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  badgeBoothAbi,
  badgeBoothContractAddress,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_ROLE_LENGTH,
  MAX_SKILL_LENGTH,
} from "@/lib/badge-booth";

const PRESETS = [
  { displayName: "Koala", role: "Builder", skill: "Base apps", note: "Shipping small onchain tools and testing mobile UX." },
  { displayName: "Studio Guest", role: "Creator", skill: "Drops", note: "Looking for clean ways to launch creator moments on Base." },
  { displayName: "Demo Friend", role: "Reviewer", skill: "Feedback", note: "Fast reader, honest notes, and useful launch checks." },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid name")) return "Name needs 1 to 36 characters.";
  if (error.message.includes("Invalid role")) return "Role needs 1 to 32 characters.";
  if (error.message.includes("Invalid skill")) return "Skill needs 1 to 36 characters.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 120 characters.";
  return error.message;
}

function BadgeCard({
  displayName,
  role,
  skill,
  note,
  maker,
  createdAt,
}: {
  displayName: string;
  role: string;
  skill: string;
  note: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="badge-card">
      <div className="lanyard" aria-hidden="true" />
      <header className="badge-top">
        <div>
          <p>Badge Booth</p>
          <h2>{displayName || "Builder"}</h2>
        </div>
        <IdCard />
      </header>

      <section className="badge-band">
        <span>{role || "Role"}</span>
        <strong>{skill || "Skill"}</strong>
      </section>

      <section className="badge-note">
        <span>Badge note</span>
        <strong>{note || "Create a public builder badge on Base."}</strong>
      </section>

      <footer className="badge-foot">
        <div>
          <span>Wallet</span>
          <strong>{shortAddress(maker)}</strong>
        </div>
        <div>
          <span>Stamped</span>
          <strong>{formatDate(createdAt)}</strong>
        </div>
      </footer>
    </article>
  );
}

export function BadgeBoothApp() {
  const [badgeIdInput, setBadgeIdInput] = useState("1");
  const [displayName, setDisplayName] = useState<string>(PRESETS[0].displayName);
  const [role, setRole] = useState<string>(PRESETS[0].role);
  const [skill, setSkill] = useState<string>(PRESETS[0].skill);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [message, setMessage] = useState("Create a public builder badge on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedBadgeId = BigInt(Math.max(1, Number(badgeIdInput || "1")));

  const badgeQuery = useReadContract({
    abi: badgeBoothAbi,
    address: badgeBoothContractAddress,
    functionName: "getBadge",
    args: [parsedBadgeId],
    query: { enabled: Boolean(badgeBoothContractAddress), refetchInterval: 12000 },
  });

  const totalQuery = useReadContract({
    abi: badgeBoothAbi,
    address: badgeBoothContractAddress,
    functionName: "nextBadgeId",
    query: { enabled: Boolean(badgeBoothContractAddress), refetchInterval: 12000 },
  });

  const tuple = badgeQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const liveBadge = useMemo(
    () =>
      tuple
        ? {
            maker: tuple[0],
            displayName: tuple[1],
            role: tuple[2],
            skill: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalBadges = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    displayName.trim().length > 0 &&
    displayName.trim().length <= MAX_NAME_LENGTH &&
    role.trim().length > 0 &&
    role.trim().length <= MAX_ROLE_LENGTH &&
    skill.trim().length > 0 &&
    skill.trim().length <= MAX_SKILL_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !badgeBoothContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_BADGE_BOOTH_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill name, role, skill, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;
    void totalQuery.refetch();
    void badgeQuery.refetch();
    const logs = parseEventLogs({ abi: badgeBoothAbi, logs: receipt.logs, eventName: "BadgeCreated" });
    const badgeId = logs[0]?.args.badgeId;
    window.setTimeout(() => {
      if (badgeId) setBadgeIdInput(badgeId.toString());
      setMessage(badgeId ? `Badge #${badgeId.toString()} created on Base.` : "Badge created on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, badgeQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, queue) => queue.findIndex((item) => item.id === connector.id) === index);

    if (connectorQueue.length === 0) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Create the badge when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function createBadge() {
    const contractAddress = badgeBoothContractAddress;
    if (createBlocker) {
      setMessage(createBlocker);
      return;
    }
    if (!contractAddress) {
      setMessage("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }
    try {
      setLastAction("create");
      setMessage("Confirm the badge in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: badgeBoothAbi,
        functionName: "createBadge",
        args: [displayName.trim(), role.trim(), skill.trim(), note.trim()],
        chainId: base.id,
      });
      setMessage("Badge sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setDisplayName(preset.displayName);
    setRole(preset.role);
    setSkill(preset.skill);
    setNote(preset.note);
  }

  return (
    <main className="booth-shell">
      <section className="booth-panel">
        <header className="booth-head">
          <div>
            <p>Badge Booth</p>
            <h1>Mint your badge.</h1>
          </div>
          <div className="badge-icon">
            <Badge />
          </div>
        </header>

        <div className="booth-stats">
          <div>
            <span>Badges</span>
            <strong>{totalBadges}</strong>
          </div>
          <div>
            <span>Chain</span>
            <strong>Base</strong>
          </div>
        </div>

        <div className="badge-presets">
          {PRESETS.map((preset, index) => (
            <button key={preset.displayName} onClick={() => applyPreset(index)}>
              <span>0{index + 1}</span>
              <div>
                <strong>{preset.displayName}</strong>
                <small>{preset.role} / {preset.skill}</small>
              </div>
            </button>
          ))}
        </div>

        <label>
          <span>Name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={MAX_NAME_LENGTH} />
        </label>
        <label>
          <span>Role</span>
          <input value={role} onChange={(event) => setRole(event.target.value)} maxLength={MAX_ROLE_LENGTH} />
        </label>
        <label>
          <span>Skill</span>
          <input value={skill} onChange={(event) => setSkill(event.target.value)} maxLength={MAX_SKILL_LENGTH} />
        </label>
        <label>
          <span>Note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={MAX_NOTE_LENGTH} rows={3} />
        </label>

        <div className="booth-actions">
          {isConnected && chainId !== base.id ? (
            <button className="mint-button" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Switch to Base
            </button>
          ) : (
            <button className="mint-button" disabled={writing || confirming} onClick={createBadge}>
              {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Mint on Base
            </button>
          )}
          {isConnected ? (
            <button className="wallet-badge" onClick={disconnectWallet}>
              {shortAddress(address)}
            </button>
          ) : (
            <button className="wallet-badge" disabled={!selectedConnector || connecting} onClick={connectWallet}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Connect wallet
            </button>
          )}
        </div>

        <p className="booth-status">{message}</p>
        {hash ? (
          <a className="booth-tx" href={`https://basescan.org/tx/${hash}`} rel="noreferrer" target="_blank">
            View transaction on BaseScan
          </a>
        ) : null}
      </section>

      <section className="booth-display">
        <BadgeCard
          displayName={liveBadge?.displayName || displayName}
          role={liveBadge?.role || role}
          skill={liveBadge?.skill || skill}
          note={liveBadge?.note || note}
          maker={liveBadge?.maker}
          createdAt={liveBadge?.createdAt}
        />

        <div className="booth-lower">
          <section className="lookup-badge">
            <div>
              <Search />
              <h2>Load badge</h2>
            </div>
            <label>
              <span>Badge ID</span>
              <input value={badgeIdInput} onChange={(event) => setBadgeIdInput(event.target.value.replace(/\D/g, ""))} />
            </label>
          </section>

          <section className="about-badge">
            <p>What it does</p>
            <strong>
              Badge Booth lets a wallet create a public builder badge with name, role, skill, note, wallet, and timestamp on Base.
            </strong>
            <div>
              <span><IdCard /> Builder badge</span>
              <span><BadgeCheck /> Public record</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
