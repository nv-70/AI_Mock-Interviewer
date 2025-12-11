const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

const getSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    if (req.query.roleProfileId) {
      filter.roleProfileId = req.query.roleProfileId;
    }

    const sessions = await InterviewSession.find(filter)
      .populate('studentId', 'name email')
      .populate('roleProfileId', 'roleName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InterviewSession.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await InterviewSession.countDocuments();
    const activeSessions = await InterviewSession.countDocuments({ status: 'active' });
    const completedSessions = await InterviewSession.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSessions,
        activeSessions,
        completedSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getStats
};

