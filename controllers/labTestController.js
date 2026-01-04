const LabTest = require('../models/LabTest');

class LabTestController {
    // Get all tests with search and filters
    async getAllTests(req, res) {
        try {
            const { search, category, minPrice, maxPrice, active } = req.query;

            let query = {};

            // Active filter (default to true)
            query.isActive = active === 'false' ? false : true;

            // Search by name or description
            if (search) {
                query.$text = { $search: search };
            }

            // Category filter
            if (category) {
                query.category = category;
            }

            // Price range filter
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = Number(minPrice);
                if (maxPrice) query.price.$lte = Number(maxPrice);
            }

            const tests = await LabTest.find(query).sort({ name: 1 });

            res.json({
                success: true,
                count: tests.length,
                tests
            });
        } catch (error) {
            console.error('Error fetching tests:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch lab tests'
            });
        }
    }

    // Get single test by ID
    async getTestById(req, res) {
        try {
            const test = await LabTest.findById(req.params.id);

            if (!test) {
                return res.status(404).json({
                    success: false,
                    error: 'Test not found'
                });
            }

            res.json({
                success: true,
                test
            });
        } catch (error) {
            console.error('Error fetching test:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch test details'
            });
        }
    }

    // Create new test (Admin only)
    async createTest(req, res) {
        try {
            const { name, description, price, turnaroundTime, category } = req.body;

            // Validation
            if (!name || !description || !price || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all required fields'
                });
            }

            const test = await LabTest.create({
                name,
                description,
                price,
                turnaroundTime: turnaroundTime || '24 hours',
                category,
                isActive: true
            });

            res.status(201).json({
                success: true,
                message: 'Test created successfully',
                test
            });
        } catch (error) {
            console.error('Error creating test:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create test'
            });
        }
    }

    // Update test (Admin only)
    async updateTest(req, res) {
        try {
            const { name, description, price, turnaroundTime, category, isActive } = req.body;

            const test = await LabTest.findById(req.params.id);

            if (!test) {
                return res.status(404).json({
                    success: false,
                    error: 'Test not found'
                });
            }

            // Update fields
            if (name !== undefined) test.name = name;
            if (description !== undefined) test.description = description;
            if (price !== undefined) test.price = price;
            if (turnaroundTime !== undefined) test.turnaroundTime = turnaroundTime;
            if (category !== undefined) test.category = category;
            if (isActive !== undefined) test.isActive = isActive;

            await test.save();

            res.json({
                success: true,
                message: 'Test updated successfully',
                test
            });
        } catch (error) {
            console.error('Error updating test:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update test'
            });
        }
    }

    // Delete test (soft delete - Admin only)
    async deleteTest(req, res) {
        try {
            const test = await LabTest.findById(req.params.id);

            if (!test) {
                return res.status(404).json({
                    success: false,
                    error: 'Test not found'
                });
            }

            test.isActive = false;
            await test.save();

            res.json({
                success: true,
                message: 'Test deactivated successfully'
            });
        } catch (error) {
            console.error('Error deleting test:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete test'
            });
        }
    }

    // Get tests by category
    async getTestsByCategory(req, res) {
        try {
            const { category } = req.params;

            const tests = await LabTest.find({
                category,
                isActive: true
            }).sort({ name: 1 });

            res.json({
                success: true,
                count: tests.length,
                tests
            });
        } catch (error) {
            console.error('Error fetching tests by category:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch tests'
            });
        }
    }

    // Get all categories
    async getCategories(req, res) {
        try {
            const categories = await LabTest.distinct('category', { isActive: true });

            res.json({
                success: true,
                categories
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories'
            });
        }
    }
}

module.exports = new LabTestController();
