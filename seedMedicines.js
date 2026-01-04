const mongoose = require('mongoose');
require('dotenv').config();

// Standard Windows paths might need adjustment if run from wrong directory
// but here we just need to connect to MongoDB and insert data
const Medicine = require('./models/Medicine');

const sampleMedicines = [
    {
        name: 'Paracetamol 500mg',
        description: 'Relieves pain and reduces fever.',
        price: 15,
        category: 'Painkillers',
        stock: 500
    },
    {
        name: 'Amoxicillin 250mg',
        description: 'Broad-spectrum antibiotic used to treat bacterial infections.',
        price: 85,
        category: 'Antibiotics',
        stock: 200
    },
    {
        name: 'Vitamin C 500mg',
        description: 'Supports immune system and skin health.',
        price: 30,
        category: 'Vitamins',
        stock: 1000
    },
    {
        name: 'Omeprazole 20mg',
        description: 'Reduces stomach acid to treat heartburn and ulcers.',
        price: 45,
        category: 'Chronic Care',
        stock: 300
    },
    {
        name: 'Metformin 500mg',
        description: 'Used to control high blood sugar in type 2 diabetes.',
        price: 25,
        category: 'Chronic Care',
        stock: 450
    },
    {
        name: 'Adhesive Bandages (Pack of 20)',
        description: 'Sterile bandages for minor cuts and scrapes.',
        price: 120,
        category: 'First Aid',
        stock: 150
    },
    {
        name: 'Antiseptic Solution 100ml',
        description: 'For wound cleaning and disinfection.',
        price: 95,
        category: 'First Aid',
        stock: 100
    },
    {
        name: 'Cough Syrup 100ml',
        description: 'Expectorant to relieve chest congestion and cough.',
        price: 110,
        category: 'General',
        stock: 250
    }
];

async function seedMedicines() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await Medicine.deleteMany({});
        console.log('Cleared existing medicines');

        const result = await Medicine.insertMany(sampleMedicines);
        console.log(`✅ Successfully inserted ${result.length} medicines`);

        await mongoose.connection.close();
        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedMedicines();
