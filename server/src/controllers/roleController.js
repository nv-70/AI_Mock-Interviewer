const { validationResult } = require('express-validator');
const RoleProfile = require('../models/RoleProfile');

const getRoles = async (req, res, next) => {
  try {
    const roles = await RoleProfile.find().sort({ roleName: 1 });

    // If no roles found, suggest seeding
    if (roles.length === 0) {
      return res.json({
        success: true,
        message: 'No roles found. Please run: npm run seed',
        data: {
          roles: [],
          count: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        roles,
        count: roles.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      roleName,
      domainTags,
      skillExpectations,
      interviewStructures
    } = req.body;

    // Check if role already exists
    const existingRole = await RoleProfile.findOne({ roleName });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role profile with this name already exists'
      });
    }

    const role = new RoleProfile({
      roleName,
      domainTags: domainTags || [],
      skillExpectations: skillExpectations || [],
      interviewStructures: interviewStructures || {
        technical: { questionCount: 5, difficulty: 'mid' },
        hr: { questionCount: 5 },
        manager: { questionCount: 4 },
        cto: { questionCount: 3 },
        case: { questionCount: 3 }
      }
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: 'Role profile created successfully',
      data: {
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  createRole
};

