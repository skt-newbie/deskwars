import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // 1. Initialize Game Configs
    console.log('📋 Setting up game configurations...');
    const gameConfigs = [
      { gameId: 'desk-wars', isEnabled: true },
      { gameId: 'hidden-chaos', isEnabled: true },
      { gameId: 'tick-tick-boom', isEnabled: true }
    ];

    for (const config of gameConfigs) {
      await prisma.gameConfig.upsert({
        where: { gameId: config.gameId },
        update: { isEnabled: config.isEnabled },
        create: config
      });
    }
    console.log(`✅ Created ${gameConfigs.length} game configurations\n`);

    // 2. Initialize Inventory
    console.log('📦 Setting up inventory...');
    const inventoryItems = [
      { id: 'MND-001', name: 'Ant Esports Wolf Mouse Pad', quantity: 1, digitalFallbackPoints: 104 },
      { id: 'MND-002', name: 'Portronics Toad 8 Transparent Wireless Bluetooth Mouse', quantity: 1, digitalFallbackPoints: 612 },
      { id: 'MND-003', name: 'Tygot Bluetooth Selfie Stick Tripod', quantity: 0, digitalFallbackPoints: 256 },
      { id: 'MND-004', name: 'Portronics Toad 23 Wireless Mouse', quantity: 0, digitalFallbackPoints: 269 },
      { id: 'MND-005', name: 'Portronics Swipe 2 Screen Cleaner', quantity: 0, digitalFallbackPoints: 119 },
      { id: 'MND-006', name: 'Portronics Bubble 3.0 Wireless Keyboard', quantity: 1, digitalFallbackPoints: 899 },
      { id: 'MND-010', name: 'Zebronics Transformer Gaming Mouse', quantity: 1, digitalFallbackPoints: 549 },
      { id: 'MND-012', name: 'Portronics Toad 23 Wireless Mouse (Blue)', quantity: 1, digitalFallbackPoints: 269 },
      { id: 'MND-013', name: 'Ambrane 60W Type-C Cable', quantity: 1, digitalFallbackPoints: 141 },
      { id: 'MND-014', name: 'Portronics Toad 8 Mouse (Black)', quantity: 1, digitalFallbackPoints: 612 },
      { id: 'MND-016', name: 'Portronics Toad 8 Mouse (White)', quantity: 1, digitalFallbackPoints: 612 },
      { id: 'MND-018', name: 'Blaze Storm Soft Bullet Gun Toy', quantity: 1, digitalFallbackPoints: 174 },
      { id: 'MND-022', name: 'Fitness Mantra Sports Socks', quantity: 12, digitalFallbackPoints: 16 },
      { id: 'MND-024', name: 'Gizga Pro 3-in-1 Cleaning Kit', quantity: 2, digitalFallbackPoints: 125 },
      { id: 'MND-026', name: 'Billebon Premium Neck Pillow (Black)', quantity: 3, digitalFallbackPoints: 223 },
      { id: 'MND-027', name: 'Iris Lavender Fragrance Ceramic Vaporizer Set', quantity: 3, digitalFallbackPoints: 249 },
      { id: 'MND-028', name: 'EKAM Reed Diffuser Gift Set', quantity: 3, digitalFallbackPoints: 249 },
      { id: 'MND-036', name: 'Cheetos Masala Balls', quantity: 1, digitalFallbackPoints: 31 },
      { id: 'MND-039', name: "Lay's Magic Masala Chips", quantity: 1, digitalFallbackPoints: 36 },
      { id: 'MND-044', name: 'Act II Classic Salted Popcorn', quantity: 1, digitalFallbackPoints: 10 },
      { id: 'MND-047', name: 'Ant Esports GP300 Gaming Controller', quantity: 1, digitalFallbackPoints: 1329 },
      { id: 'MND-049', name: 'DesiDiya Universe Crystal Ball LED Lamp', quantity: 3, digitalFallbackPoints: 179 },
      { id: 'MND-054', name: 'Quace Crystal Rain Drop String Light', quantity: 1, digitalFallbackPoints: 199 },
      { id: 'MND-057', name: 'Oral-B Pro Clean Sensitive Toothbrush', quantity: 6, digitalFallbackPoints: 50 }
    ];

    for (const item of inventoryItems) {
      await prisma.inventory.upsert({
        where: { id: item.id },
        update: { 
          name: item.name, 
          quantity: item.quantity, 
          digitalFallbackPoints: item.digitalFallbackPoints 
        },
        create: item
      });
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items\n`);

    // 3. Initialize Game Allocations
    console.log('🎮 Setting up game allocations...');
    const allocations = [
      // Complete the Madness (FP) - 3 prizes
      { allocationId: 'FP_01', gameCode: 'FP', gameName: 'Complete the Madness', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-047' },
      { allocationId: 'FP_02', gameCode: 'FP', gameName: 'Complete the Madness', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-002' },
      { allocationId: 'FP_03', gameCode: 'FP', gameName: 'Complete the Madness', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-006' },
      
      // Desk Wars (CD) - 3 prizes
      { allocationId: 'CD_01', gameCode: 'CD', gameName: 'Desk Wars', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-014' },
      { allocationId: 'CD_02', gameCode: 'CD', gameName: 'Desk Wars', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-016' },
      { allocationId: 'CD_03', gameCode: 'CD', gameName: 'Desk Wars', category: 'Premium Prize', rewardType: 'Premium Reward', inventoryId: 'MND-010' },
      
      // QR Hunt (QR) - 15 prizes
      { allocationId: 'QR_01', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-012' },
      { allocationId: 'QR_02', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-013' },
      { allocationId: 'QR_03', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-018' },
      { allocationId: 'QR_04', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-001' },
      { allocationId: 'QR_05', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-054' },
      { allocationId: 'QR_06', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-049' },
      { allocationId: 'QR_07', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-049' },
      { allocationId: 'QR_08', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-049' },
      { allocationId: 'QR_09', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-028' },
      { allocationId: 'QR_10', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-028' },
      { allocationId: 'QR_11', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-028' },
      { allocationId: 'QR_12', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-027' },
      { allocationId: 'QR_13', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-027' },
      { allocationId: 'QR_14', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-027' },
      { allocationId: 'QR_15', gameCode: 'QR', gameName: 'Scan and Survive', category: 'QR Hunt Prize', rewardType: 'Hunt Reward', inventoryId: 'MND-026' },
      
      // Mystery Gifts (MG) - 10 prizes
      { allocationId: 'MG_01', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Premium Box', rewardType: 'Premium Reward', inventoryId: 'MND-014' },
      { allocationId: 'MG_02', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Premium Box', rewardType: 'Premium Reward', inventoryId: 'MND-016' },
      { allocationId: 'MG_03', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Premium Box', rewardType: 'Premium Reward', inventoryId: 'MND-012' },
      { allocationId: 'MG_04', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Useful/Fun Gift', rewardType: 'Useful Reward', inventoryId: 'MND-004' },
      { allocationId: 'MG_05', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Useful/Fun Gift', rewardType: 'Useful Reward', inventoryId: 'MND-013' },
      { allocationId: 'MG_06', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Useful/Fun Gift', rewardType: 'Useful Reward', inventoryId: 'MND-018' },
      { allocationId: 'MG_07', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Funny/Dummy Box', rewardType: 'Dummy Reward', inventoryId: 'MND-036' },
      { allocationId: 'MG_08', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Funny/Dummy Box', rewardType: 'Dummy Reward', inventoryId: 'MND-039' },
      { allocationId: 'MG_09', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Funny/Dummy Box', rewardType: 'Dummy Reward', inventoryId: 'MND-047' },
      { allocationId: 'MG_10', gameCode: 'MG', gameName: 'Mystery Gifts', category: 'Funny/Dummy Box', rewardType: 'Dummy Reward', inventoryId: 'MND-044' }
    ];

    for (const allocation of allocations) {
      await prisma.gameAllocation.upsert({
        where: { allocationId: allocation.allocationId },
        update: allocation,
        create: allocation
      });
    }
    console.log(`✅ Created ${allocations.length} game allocations\n`);

    // 4. Initialize QR Definitions with Riddles
    console.log('🔍 Setting up QR Hunt riddles and clues...');
    const qrDefinitions = [
      {
        qrId: 'QRP_01',
        riddle: 'I follow you everywhere, mimic your every move, yet vanish the moment darkness arrives. What am I?',
        answer: 'shadow',
        nextClue: 'Find the place where chairs disappear faster than snacks.',
        guaranteedPrizeId: 'QR_01'
      },
      {
        qrId: 'QRP_02',
        riddle: 'I become larger every time something is taken away from me. What am I?',
        answer: 'hole',
        nextClue: 'Knowledge sleeps quietly here while deadlines scream outside.',
        guaranteedPrizeId: 'QR_02'
      },
      {
        qrId: 'QRP_03',
        riddle: 'The person who makes it has no use for it. The person who buys it never sees it. The person who uses it never knows it. What is it?',
        answer: 'coffin',
        nextClue: 'Find the place where forgotten office treasures vanish forever.',
        guaranteedPrizeId: 'QR_03'
      },
      {
        qrId: 'QRP_04',
        riddle: 'I can fill a room without taking up any space. What am I?',
        answer: 'light',
        nextClue: 'Find the battlefield where caffeine defeats productivity.',
        guaranteedPrizeId: 'QR_04'
      },
      {
        qrId: 'QRP_05',
        riddle: 'I shave every day, but my beard stays the same. Who am I?',
        answer: 'barber',
        nextClue: 'Find the place people mysteriously disappear to during long calls.',
        guaranteedPrizeId: 'QR_05'
      },
      {
        qrId: 'QRP_06',
        riddle: 'I have cities but no houses, forests but no trees, and rivers but no water. What am I?',
        answer: 'map',
        nextClue: 'Find the place where people pretend standing improves productivity.',
        guaranteedPrizeId: 'QR_06'
      },
      {
        qrId: 'QRP_07',
        riddle: 'Feed me and I live. Give me water and I die. What am I?',
        answer: 'fire',
        nextClue: 'Find the unofficial office sleeping headquarters.',
        guaranteedPrizeId: 'QR_07'
      },
      {
        qrId: 'QRP_08',
        riddle: 'The more of me there is, the less you can see. What am I?',
        answer: 'darkness',
        nextClue: 'Find the glowing wall celebrating old victories.',
        guaranteedPrizeId: 'QR_08'
      },
      {
        qrId: 'QRP_09',
        riddle: "I'm always coming, but I never arrive. What am I?",
        answer: 'tomorrow',
        nextClue: 'Find the giant screen where meetings become background noise.',
        guaranteedPrizeId: 'QR_09'
      },
      {
        qrId: 'QRP_10',
        riddle: 'What can you hold in your left hand but never in your right?',
        answer: 'your right elbow',
        nextClue: 'Find the second standing kingdom of fake ergonomic discipline.',
        guaranteedPrizeId: 'QR_10'
      },
      {
        qrId: 'QRP_11',
        riddle: 'The more you leave behind, the more you take with you. What are they?',
        answer: 'footsteps',
        nextClue: 'Find the wall where office legends are permanently framed.',
        guaranteedPrizeId: 'QR_11'
      },
      {
        qrId: 'QRP_12',
        riddle: 'I have branches, but no fruit, trunk, or leaves. What am I?',
        answer: 'bank',
        nextClue: 'Find the place that welcomes everyone before chaos starts daily.',
        guaranteedPrizeId: 'QR_12'
      },
      {
        qrId: 'QRP_13',
        riddle: 'What invention lets you look right through a wall?',
        answer: 'window',
        nextClue: 'Find the magical bin where failed printouts go to die.',
        guaranteedPrizeId: 'QR_13'
      },
      {
        qrId: 'QRP_14',
        riddle: 'I have lakes with no water, mountains with no stone, and cities with no buildings. What am I?',
        answer: 'map',
        nextClue: 'Find the giant screen upstairs where cricket scores matter more than work.',
        guaranteedPrizeId: 'QR_14'
      },
      {
        qrId: 'QRP_15',
        riddle: 'What is seen in the middle of March and April that cannot be seen at the beginning or end of either month?',
        answer: 'r',
        nextClue: 'Find the hidden washroom escape route nobody admits using.',
        guaranteedPrizeId: 'QR_15'
      }
    ];

    for (const qr of qrDefinitions) {
      await prisma.qrDefinition.upsert({
        where: { qrId: qr.qrId },
        update: qr,
        create: qr
      });
    }
    console.log(`✅ Created ${qrDefinitions.length} QR Hunt riddles\n`);

    console.log('✨ Database initialization complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Game Configs: ${gameConfigs.length}`);
    console.log(`   - Inventory Items: ${inventoryItems.length}`);
    console.log(`   - Game Allocations: ${allocations.length}`);
    console.log(`   - QR Hunt Riddles: ${qrDefinitions.length}`);
    console.log('\n🎉 System ready for use!\n');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

// Made with Bob
