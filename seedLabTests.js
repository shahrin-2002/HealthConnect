/**
 * Seed Script for Lab Tests
 * Run this to populate the database with sample lab tests
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const LabTest = require('./models/LabTest');

// Sample lab tests data
const sampleTests = [
    // Blood Tests
    {
        name: 'Complete Blood Count (CBC)',
        description: 'Measures different components of blood including red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.',
        price: 500,
        turnaroundTime: '24 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Lipid Profile',
        description: 'Measures cholesterol and triglycerides to assess risk of cardiovascular disease.',
        price: 800,
        turnaroundTime: '24 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Blood Glucose (Fasting)',
        description: 'Measures blood sugar levels after fasting to screen for diabetes.',
        price: 300,
        turnaroundTime: '6 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Liver Function Test (LFT)',
        description: 'Evaluates liver health by measuring enzymes, proteins, and bilirubin.',
        price: 1000,
        turnaroundTime: '24 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Kidney Function Test (KFT)',
        description: 'Assesses kidney function through creatinine, urea, and electrolyte levels.',
        price: 900,
        turnaroundTime: '24 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Thyroid Profile (T3, T4, TSH)',
        description: 'Measures thyroid hormone levels to evaluate thyroid function.',
        price: 1200,
        turnaroundTime: '48 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Vitamin D Test',
        description: 'Measures vitamin D levels to assess bone health and immune function.',
        price: 1500,
        turnaroundTime: '48 hours',
        category: 'Blood',
        isActive: true
    },
    {
        name: 'Hemoglobin A1C (HbA1c)',
        description: 'Measures average blood sugar levels over the past 2-3 months for diabetes management.',
        price: 700,
        turnaroundTime: '24 hours',
        category: 'Blood',
        isActive: true
    },

    // Urine Tests
    {
        name: 'Urine Routine & Microscopy',
        description: 'Comprehensive urine analysis to detect infections, kidney disease, and diabetes.',
        price: 400,
        turnaroundTime: '12 hours',
        category: 'Urine',
        isActive: true
    },
    {
        name: 'Urine Culture',
        description: 'Identifies bacteria causing urinary tract infections and determines antibiotic sensitivity.',
        price: 800,
        turnaroundTime: '48 hours',
        category: 'Urine',
        isActive: true
    },

    // Radiology
    {
        name: 'Chest X-Ray',
        description: 'Imaging test to examine the heart, lungs, and chest bones.',
        price: 1200,
        turnaroundTime: '2 hours',
        category: 'Radiology',
        isActive: true
    },
    {
        name: 'Ultrasound - Abdomen',
        description: 'Imaging of abdominal organs including liver, kidneys, gallbladder, and pancreas.',
        price: 2000,
        turnaroundTime: '4 hours',
        category: 'Radiology',
        isActive: true
    },
    {
        name: 'ECG (Electrocardiogram)',
        description: 'Records electrical activity of the heart to detect heart problems.',
        price: 600,
        turnaroundTime: '1 hour',
        category: 'Radiology',
        isActive: true
    },

    // Pathology
    {
        name: 'Dengue NS1 Antigen',
        description: 'Early detection test for dengue fever infection.',
        price: 900,
        turnaroundTime: '6 hours',
        category: 'Pathology',
        isActive: true
    },
    {
        name: 'COVID-19 RT-PCR',
        description: 'Molecular test to detect SARS-CoV-2 virus causing COVID-19.',
        price: 2500,
        turnaroundTime: '24 hours',
        category: 'Pathology',
        isActive: true
    },

    // Microbiology
    {
        name: 'Blood Culture',
        description: 'Detects bacteria or fungi in blood to diagnose bloodstream infections.',
        price: 1800,
        turnaroundTime: '72 hours',
        category: 'Microbiology',
        isActive: true
    },
    {
        name: 'Sputum Culture',
        description: 'Identifies microorganisms causing respiratory infections.',
        price: 1000,
        turnaroundTime: '48 hours',
        category: 'Microbiology',
        isActive: true
    },

    // Biochemistry
    {
        name: 'Serum Electrolytes',
        description: 'Measures sodium, potassium, chloride, and bicarbonate levels.',
        price: 700,
        turnaroundTime: '12 hours',
        category: 'Biochemistry',
        isActive: true
    },
    {
        name: 'Calcium & Phosphorus',
        description: 'Measures calcium and phosphorus levels for bone health assessment.',
        price: 600,
        turnaroundTime: '24 hours',
        category: 'Biochemistry',
        isActive: true
    },
    {
        name: 'Iron Studies',
        description: 'Comprehensive test to evaluate iron levels and diagnose anemia.',
        price: 1100,
        turnaroundTime: '24 hours',
        category: 'Biochemistry',
        isActive: true
    }
];

async function seedTests() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing tests (optional - comment out if you want to keep existing tests)
        await LabTest.deleteMany({});
        console.log('Cleared existing lab tests');

        // Insert sample tests
        const tests = await LabTest.insertMany(sampleTests);
        console.log(`✅ Successfully inserted ${tests.length} lab tests`);

        // Display inserted tests
        tests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.name} - ৳${test.price} (${test.category})`);
        });

        // Close connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run seed function
seedTests();
