import type { Address } from "viem";

export const MAX_NAME_LENGTH = 36;
export const MAX_ROLE_LENGTH = 32;
export const MAX_SKILL_LENGTH = 36;
export const MAX_NOTE_LENGTH = 120;

export const badgeBoothAbi = [
  {
    type: "event",
    name: "BadgeCreated",
    inputs: [
      { name: "badgeId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "displayName", type: "string", indexed: false },
      { name: "role", type: "string", indexed: false },
      { name: "skill", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "createBadge",
    stateMutability: "nonpayable",
    inputs: [
      { name: "displayName", type: "string" },
      { name: "role", type: "string" },
      { name: "skill", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "badgeId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getBadge",
    stateMutability: "view",
    inputs: [{ name: "badgeId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "displayName", type: "string" },
      { name: "role", type: "string" },
      { name: "skill", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextBadgeId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredBadgeBoothContractAddress =
  process.env.NEXT_PUBLIC_BADGE_BOOTH_CONTRACT_ADDRESS?.trim();

export const badgeBoothContractAddress = isAddressLike(configuredBadgeBoothContractAddress)
  ? (configuredBadgeBoothContractAddress as Address)
  : undefined;
