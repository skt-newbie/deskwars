import prisma from "../db/index.js";

export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Seed default game configs
    const defaultGames = ['roast-arena', 'hidden-chaos', 'tick-tick-boom'];
    for (const gameId of defaultGames) {
      await prisma.gameConfig.upsert({
        where: { gameId },
        update: {},
        create: { gameId, isEnabled: true }
      });
    }

    // Seed inventory
    const defaultItems = [
      { id: 'item_01', name: 'Chaos Carnival Mug', quantity: 10, digitalFallbackPoints: 100 },
      { id: 'item_02', name: 'Void T-Shirt', quantity: 5, digitalFallbackPoints: 250 },
      { id: 'item_03', name: 'Glitch Sticker Pack', quantity: 50, digitalFallbackPoints: 50 }
    ];
    for (const item of defaultItems) {
      await prisma.inventory.upsert({
        where: { id: item.id },
        update: {},
        create: item
      });
    }

    // Seed Mystery Nodes
    const mysteryNodes = [
      { id: 'MYSTERY_ALPHA_92', points: 75, rewardText: "Quantum Fragment Found" },
      { id: 'MYSTERY_BETA_14', points: 120, rewardText: "Void Essence Captured" },
      { id: 'MYSTERY_VOICE_404', points: 50, rewardText: "Vibe Check: Spectral" },
      { id: 'VOID_TREASURE_01', points: 200, rewardText: "Ancient Data Cache" }
    ];
    for (const node of mysteryNodes) {
      await prisma.mysteryNode.upsert({
        where: { id: node.id },
        update: {},
        create: node
      });
    }

    // Note: QR Definitions are now managed via SQL script (scripts/update-qr-definitions.sql)
    // Skipping QR seeding to avoid conflicts with production data
    console.log("✓ Skipping QR definitions (managed via SQL scripts)");

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Made with Bob
