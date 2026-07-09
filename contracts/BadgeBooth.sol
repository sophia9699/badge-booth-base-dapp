// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BadgeBooth {
    uint256 public nextBadgeId = 1;

    struct Badge {
        address maker;
        string displayName;
        string role;
        string skill;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Badge) private badges;

    event BadgeCreated(
        uint256 indexed badgeId,
        address indexed maker,
        string displayName,
        string role,
        string skill
    );

    function createBadge(
        string calldata displayName,
        string calldata role,
        string calldata skill,
        string calldata note
    ) external returns (uint256 badgeId) {
        require(bytes(displayName).length > 0 && bytes(displayName).length <= 36, "Invalid name");
        require(bytes(role).length > 0 && bytes(role).length <= 32, "Invalid role");
        require(bytes(skill).length > 0 && bytes(skill).length <= 36, "Invalid skill");
        require(bytes(note).length > 0 && bytes(note).length <= 120, "Invalid note");

        badgeId = nextBadgeId++;
        badges[badgeId] = Badge({
            maker: msg.sender,
            displayName: displayName,
            role: role,
            skill: skill,
            note: note,
            createdAt: block.timestamp
        });

        emit BadgeCreated(badgeId, msg.sender, displayName, role, skill);
    }

    function getBadge(
        uint256 badgeId
    )
        external
        view
        returns (
            address maker,
            string memory displayName,
            string memory role,
            string memory skill,
            string memory note,
            uint256 createdAt
        )
    {
        Badge storage badge = badges[badgeId];
        return (
            badge.maker,
            badge.displayName,
            badge.role,
            badge.skill,
            badge.note,
            badge.createdAt
        );
    }
}
