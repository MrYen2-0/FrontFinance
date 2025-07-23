/**
 * Sistema inteligente que conecta gastos directamente con presupuestos existentes
 */

// Palabras clave organizadas por categorías comunes de presupuesto
const budgetCategoryKeywords = {
  'Comida': [
    'mcdonalds', 'kfc', 'subway', 'starbucks', 'dominos', 'pizza', 'burger', 'taco',
    'restaurant', 'restaurante', 'cafe', 'coffee', 'almuerzo', 'desayuno', 'cena',
    'comida', 'lunch', 'dinner', 'breakfast', 'food', 'meal', 'snack', 'bebida',
    'super', 'mercado', 'walmart', 'costco', 'soriana', 'chedraui', 'oxxo'
  ],
  
  'Transporte': [
    'gasolina', 'gas', 'pemex', 'shell', 'mobil', 'combustible', 'taxi', 'uber',
    'didi', 'metro', 'bus', 'camion', 'transporte', 'pasaje', 'peaje', 'caseta',
    'mecanico', 'taller', 'aceite', 'llantas', 'estacionamiento', 'parking'
  ],
  
  'Entretenimiento': [
    'netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'youtube', 'cine',
    'cinema', 'movie', 'pelicula', 'teatro', 'concierto', 'bar', 'club', 'disco',
    'juego', 'game', 'xbox', 'playstation', 'nintendo', 'karaoke', 'bowling'
  ],
  
  'Servicios': [
    'luz', 'agua', 'gas', 'telefono', 'internet', 'cable', 'cfe', 'telmex',
    'izzi', 'totalplay', 'sky', 'banco', 'comision', 'seguro', 'reparacion'
  ],
  
  'Salud': [
    'doctor', 'medico', 'hospital', 'farmacia', 'medicina', 'consulta', 'dentista',
    'laboratorio', 'analisis', 'vitaminas', 'terapia', 'clinica'
  ],
  
  'Compras': [
    'amazon', 'mercadolibre', 'liverpool', 'ropa', 'clothes', 'zapatos', 'shoes',
    'electronico', 'celular', 'laptop', 'zara', 'h&m', 'nike', 'adidas'
  ],
  
  'Educación': [
    'escuela', 'universidad', 'curso', 'clase', 'libro', 'material', 'cuaderno',
    'udemy', 'coursera', 'platzi', 'certificacion', 'diplomado'
  ]
}

/**
 * Sugiere categoría basada en presupuestos existentes del usuario
 * @param {string} description - Descripción del gasto
 * @param {number} amount - Monto del gasto
 * @param {Array} userBudgets - Presupuestos configurados del usuario
 * @param {Array} userHistory - Historial de transacciones para aprender
 * @returns {Object} - Sugerencia con impacto en presupuesto
 */
export const suggestBudgetCategory = (description, amount, userBudgets = [], userHistory = []) => {
  if (!description || userBudgets.length === 0) {
    return { 
      category: null, 
      confidence: 0, 
      budgetImpact: null,
      alternatives: [],
      availableCategories: userBudgets.map(b => b.category)
    }
  }

  const text = description.toLowerCase().trim()
  const scores = {}
  
  // Solo analizar categorías que el usuario tiene presupuestadas
  const availableCategories = userBudgets.map(budget => budget.category)
  
  // 1. Buscar coincidencias en categorías existentes
  availableCategories.forEach(category => {
    const keywords = budgetCategoryKeywords[category] || []
    let score = 0
    let matches = 0
    
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matches++
        score += keyword.length * 2 // Mayor peso para palabras más específicas
      }
    })
    
    if (matches > 0) {
      scores[category] = score
    }
  })

  // 2. Aprender de patrones del usuario (solo categorías existentes)
  if (userHistory && userHistory.length > 0) {
    userHistory
      .filter(t => availableCategories.includes(t.category))
      .forEach(transaction => {
        if (transaction.description && transaction.category) {
          const similarity = calculateSimilarity(text, transaction.description.toLowerCase())
          if (similarity > 0.6) {
            scores[transaction.category] = (scores[transaction.category] || 0) + similarity * 25
          }
        }
      })
  }

  // 3. Análisis por contexto de monto
  if (amount && userBudgets.length > 0) {
    const numAmount = parseFloat(amount)
    
    userBudgets.forEach(budget => {
      const avgTransaction = budget.spent / Math.max(budget.transactionCount || 1, 1)
      
      // Si el monto es similar al promedio de esa categoría, darle puntos
      if (Math.abs(numAmount - avgTransaction) < avgTransaction * 0.5) {
        scores[budget.category] = (scores[budget.category] || 0) + 10
      }
    })
  }

  // 4. Si no hay coincidencias, sugerir basado en monto promedio
  if (Object.keys(scores).length === 0 && amount) {
    const numAmount = parseFloat(amount)
    
    userBudgets.forEach(budget => {
      const avgSpend = budget.spent / Math.max(budget.transactionCount || 1, 1)
      
      // Sugerir categoría con monto promedio más cercano
      if (numAmount >= avgSpend * 0.5 && numAmount <= avgSpend * 2) {
        scores[budget.category] = 5
      }
    })
  }

  // 5. Encontrar la mejor sugerencia
  if (Object.keys(scores).length === 0) {
    return { 
      category: null, 
      confidence: 0, 
      budgetImpact: null,
      alternatives: availableCategories.slice(0, 3),
      availableCategories
    }
  }

  const sortedCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])

  const topCategory = sortedCategories[0][0]
  const topScore = sortedCategories[0][1]
  const confidence = Math.min(Math.round((topScore / 20) * 100), 95)

  // 6. Calcular impacto en presupuesto
  const affectedBudget = userBudgets.find(b => b.category === topCategory)
  const budgetImpact = affectedBudget ? calculateBudgetImpact(affectedBudget, amount) : null

  return {
    category: topCategory,
    confidence,
    budgetImpact,
    alternatives: sortedCategories.slice(1, 3).map(([cat]) => cat),
    availableCategories,
    reasoning: generateBudgetReasoning(text, topCategory, budgetImpact)
  }
}

/**
 * Calcula el impacto del gasto en el presupuesto
 */
const calculateBudgetImpact = (budget, amount) => {
  if (!amount || !budget) return null
  
  const numAmount = parseFloat(amount)
  const newSpent = budget.spent + numAmount
  const newPercentage = (newSpent / budget.planned) * 100
  const currentPercentage = (budget.spent / budget.planned) * 100
  
  return {
    currentSpent: budget.spent,
    newSpent: newSpent,
    planned: budget.planned,
    remaining: Math.max(budget.planned - newSpent, 0),
    currentPercentage: Math.round(currentPercentage),
    newPercentage: Math.round(newPercentage),
    increasePercentage: Math.round(newPercentage - currentPercentage),
    willExceed: newSpent > budget.planned,
    severity: newPercentage > 100 ? 'danger' : newPercentage > 80 ? 'warning' : 'good'
  }
}

/**
 * Genera explicación inteligente
 */
const generateBudgetReasoning = (text, category, budgetImpact) => {
  const matchedKeywords = budgetCategoryKeywords[category]?.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ) || []

  let reasoning = ''
  
  if (matchedKeywords.length > 0) {
    reasoning = `Detecté: "${matchedKeywords[0]}"`
  } else {
    reasoning = 'Basado en tus patrones anteriores'
  }

  if (budgetImpact) {
    if (budgetImpact.willExceed) {
      reasoning += ` ⚠️ Excederías tu presupuesto`
    } else if (budgetImpact.newPercentage > 80) {
      reasoning += ` ⚡ Quedarías al ${budgetImpact.newPercentage}%`
    } else {
      reasoning += ` ✅ Presupuesto saludable`
    }
  }

  return reasoning
}

/**
 * Calcula similaridad entre textos
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = text1.split(' ').filter(w => w.length > 2)
  const words2 = text2.split(' ').filter(w => w.length > 2)
  const commonWords = words1.filter(word => words2.includes(word))
  return commonWords.length / Math.max(words1.length, words2.length)
}

/**
 * Aprende de nueva transacción
 */
export const learnBudgetTransaction = (description, category, amount) => {
  const learningData = JSON.parse(localStorage.getItem('budgetCategoryLearning') || '[]')
  
  learningData.push({
    description: description.toLowerCase(),
    category,
    amount: parseFloat(amount),
    timestamp: Date.now()
  })

  // Mantener solo las últimas 50 transacciones
  if (learningData.length > 50) {
    learningData.splice(0, learningData.length - 50)
  }

  localStorage.setItem('budgetCategoryLearning', JSON.stringify(learningData))
}

/**
 * Obtiene historial de aprendizaje
 */
export const getBudgetLearningHistory = () => {
  return JSON.parse(localStorage.getItem('budgetCategoryLearning') || '[]')
}