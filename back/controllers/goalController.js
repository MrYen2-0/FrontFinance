const { Goal } = require('../models');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Obtener metas del usuario
const getGoals = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const goals = await Goal.findAll({
      where,
      order: [['priority', 'DESC'], ['deadline', 'ASC']]
    });

    // Calcular estadísticas adicionales
    const goalsWithStats = goals.map(goal => {
      const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
      const daysLeft = moment(goal.deadline).diff(moment(), 'days');
      const isCompleted = parseFloat(goal.current_amount) >= parseFloat(goal.target_amount);
      
      return {
        ...goal.toJSON(),
        progress: Math.min(progress, 100),
        daysLeft: Math.max(daysLeft, 0),
        isCompleted,
        remaining: parseFloat(goal.target_amount) - parseFloat(goal.current_amount)
      };
    });

    res.json({ goals: goalsWithStats });
  } catch (error) {
    console.error('Error al obtener metas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nueva meta
const createGoal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: errors.array() 
      });
    }

    const { name, description, target_amount, deadline, category, priority } = req.body;

    const goal = await Goal.create({
      user_id: req.user.id,
      name,
      description,
      target_amount,
      current_amount: 0,
      deadline,
      category,
      priority: priority || 1,
      status: 'active'
    });

    res.status(201).json({
      message: 'Meta creada exitosamente',
      goal
    });
  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar progreso de meta
const updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const goal = await Goal.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    const newAmount = parseFloat(amount);
    if (newAmount < 0) {
      return res.status(400).json({ message: 'El monto no puede ser negativo' });
    }

    goal.current_amount = newAmount;

    // Verificar si se completó la meta
    if (parseFloat(goal.current_amount) >= parseFloat(goal.target_amount)) {
      goal.status = 'completed';
    }

    await goal.save();

    res.json({
      message: 'Progreso actualizado exitosamente',
      goal
    });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar meta
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, target_amount, deadline, category, priority, status } = req.body;

    const goal = await Goal.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    await goal.update({
      name,
      description,
      target_amount,
      deadline,
      category,
      priority,
      status
    });

    res.json({
      message: 'Meta actualizada exitosamente',
      goal
    });
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar meta
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    await goal.destroy();

    res.json({ message: 'Meta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de metas
const getGoalStats = async (req, res) => {
  try {
    const totalGoals = await Goal.count({
      where: { user_id: req.user.id }
    });

    const completedGoals = await Goal.count({
      where: { user_id: req.user.id, status: 'completed' }
    });

    const activeGoals = await Goal.count({
      where: { user_id: req.user.id, status: 'active' }
    });

    const totalSaved = await Goal.sum('current_amount', {
      where: { user_id: req.user.id }
    });

    res.json({
      totalGoals,
      completedGoals,
      activeGoals,
      totalSaved: totalSaved || 0,
      completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
  getGoalStats
};