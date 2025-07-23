// Base de datos de palabras clave para categorización automática
const categoryRules = {
  'Comida': [
    // Restaurantes y cadenas
    'mcdonalds', 'kfc', 'subway', 'starbucks', 'dominos', 'pizza', 'burger', 'taco',
    'restaurant', 'restaurante', 'cafe', 'coffee', 'cafeteria', 'bar', 'pub',
    // Supermercados
    'walmart', 'costco', 'mercado', 'super', 'tienda', 'grocery', 'market',
    'soriana', 'chedraui', 'oxxo', 'seven', '7-eleven',
    // Comida general
    'almuerzo', 'desayuno', 'cena', 'comida', 'lunch', 'dinner', 'breakfast',
    'food', 'meal', 'snack', 'bebida', 'drink', 'agua', 'refresco', 'soda'
  ],
  
  'Transporte': [
    // Combustible
    'gasolina', 'gas', 'pemex', 'shell', 'mobil', 'bp', 'combustible', 'diesel',
    // Transporte público
    'metro', 'bus', 'camion', 'taxi', 'uber', 'didi', 'lyft', 'cabify',
    'transporte', 'pasaje', 'boleto', 'ticket', 'toll', 'caseta', 'peaje',
    // Mantenimiento
    'mecanico', 'taller', 'aceite', 'llantas', 'neumaticos', 'refacciones'
  ],
  
  'Entretenimiento': [
    // Streaming y suscripciones
    'netflix', 'spotify', 'disney', 'amazon prime', 'hbo', 'apple music',
    'youtube', 'twitch', 'paramount', 'crunchyroll',
    // Entretenimiento físico
    'cine', 'cinema', 'movie', 'pelicula', 'teatro', 'concierto', 'show',
    'juego', 'game', 'xbox', 'playstation', 'nintendo', 'steam',
    // Salidas
    'bar', 'club', 'disco', 'fiesta', 'party', 'karaoke', 'bowling'
  ],
  
  'Servicios': [
    // Servicios básicos
    'luz', 'agua', 'gas', 'telefono', 'internet', 'cable', 'electricity',
    'cfe', 'telmex', 'izzi', 'totalplay', 'megacable', 'sky',
    // Servicios profesionales
    'banco', 'bank', 'comision', 'fee', 'seguro', 'insurance',
    'reparacion', 'plomero', 'electricista', 'jardinero'
  ],
  
  'Salud': [
    'doctor', 'medico', 'hospital', 'clinica', 'farmacia', 'pharmacy',
    'medicina', 'medicamento', 'vitaminas', 'consulta', 'dentista',
    'laboratorio', 'analisis', 'rayos x', 'ultrasonido', 'terapia',
    'psicolog', 'nutriologo', 'dermatologo'
  ],
  
  'Compras': [
    // Tiendas departamentales
    'amazon', 'mercadolibre', 'liverpool', 'palacio', 'sears', 'walmart',
    // Ropa y accesorios
    'ropa', 'clothes', 'shirt', 'pantalon', 'zapatos', 'shoes', 'nike', 'adidas',
    'zara', 'h&m', 'forever21', 'pull&bear', 'bershka',
    // Electrónicos
    'electronico', 'celular', 'phone', 'laptop', 'tablet', 'audifonos',
    'apple', 'samsung', 'xiaomi', 'huawei', 'best buy'
  ],
  
  'Educación': [
    'escuela', 'universidad', 'colegio', 'curso', 'clase', 'maestria',
    'diplomado', 'certificacion', 'libro', 'material', 'cuaderno',
    'udemy', 'coursera', 'platzi', 'educacion', 'tuition'
  ],
  
  'Salario': [
    'salario', 'sueldo', 'nomina', 'pago', 'salary', 'wage', 'payroll',
    'empresa', 'trabajo', 'work', 'job', 'bonus', 'aguinaldo'
  ],
  
  'Freelance': [
    'freelance', 'proyecto', 'client', 'cliente', 'consultoria',
    'diseño', 'programacion', 'desarrollo', 'web', 'app'
  ]
}

// Categorías con sus pesos (más específicas tienen mayor peso)
const categoryWeights = {
  'Salud': 1.0,
  'Salario': 1.0,
  'Freelance': 0.9,
  'Educación': 0.9,
  'Servicios': 0.8,
  'Transporte': 0.7,
  'Entretenimiento': 0.6,
  'Comida': 0.5,
  'Compras': 0.4
}

/**
 * Analiza una descripción y sugiere automáticamente la categoría más apropiada
 * @param {string} description - Descripción de la transacción
 * @param {string} amount - Monto (opcional, para contexto adicional)
 * @param {Array} userHistory - Historial del usuario para aprender patrones
 * @returns {Object} - {category, confidence, alternatives}
 */
export const suggestCategory = (description, amount = null, userHistory = []) => {
  if (!description) {
    return { category: 'Otros', confidence: 0, alternatives: [] }
  }

  const text = description.toLowerCase().trim()
  const scores = {}
  
  // 1. Buscar coincidencias exactas de palabras clave
  Object.entries(categoryRules).forEach(([category, keywords]) => {
    let score = 0
    let matches = 0
    
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matches++
        // Palabras más largas tienen mayor peso
        score += keyword.length * (categoryWeights[category] || 0.5)
      }
    })
    
    if (matches > 0) {
      scores[category] = score
    }
  })

  // 2. Análisis por contexto de monto (opcional)
  if (amount) {
    const numAmount = parseFloat(amount)
    
    // Montos altos probablemente son salario, renta, o compras grandes
    if (numAmount > 2000) {
      scores['Salario'] = (scores['Salario'] || 0) + 50
      scores['Compras'] = (scores['Compras'] || 0) + 20
    }
    // Montos muy pequeños probablemente son comida o transporte
    else if (numAmount < 50) {
      scores['Comida'] = (scores['Comida'] || 0) + 10
      scores['Transporte'] = (scores['Transporte'] || 0) + 10
    }
  }

  // 3. Aprender de patrones del usuario
  if (userHistory && userHistory.length > 0) {
    userHistory.forEach(transaction => {
      if (transaction.description && transaction.category) {
        const similarity = calculateSimilarity(text, transaction.description.toLowerCase())
        if (similarity > 0.7) {
          scores[transaction.category] = (scores[transaction.category] || 0) + similarity * 30
        }
      }
    })
  }

  // 4. Encontrar la mejor categoría
  if (Object.keys(scores).length === 0) {
    return { category: 'Otros', confidence: 0, alternatives: [] }
  }

  const sortedCategories = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([category, score]) => ({
      category,
      confidence: Math.min(Math.round((score / 100) * 100), 95)
    }))

  const topCategory = sortedCategories[0]
  const alternatives = sortedCategories.slice(1, 3)

  return {
    category: topCategory.category,
    confidence: topCategory.confidence,
    alternatives: alternatives.map(alt => alt.category),
    reasoning: generateReasoning(text, topCategory.category)
  }
}

/**
 * Calcula similaridad entre dos textos
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = text1.split(' ')
  const words2 = text2.split(' ')
  const commonWords = words1.filter(word => words2.includes(word))
  return commonWords.length / Math.max(words1.length, words2.length)
}

/**
 * Genera una explicación de por qué se sugirió esa categoría
 */
const generateReasoning = (text, category) => {
  const matchedKeywords = categoryRules[category]?.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ) || []

  if (matchedKeywords.length > 0) {
    return `Detecté palabras clave: ${matchedKeywords.slice(0, 2).join(', ')}`
  }
  return 'Basado en patrones similares'
}

/**
 * Aprende de una nueva transacción para mejorar futuras sugerencias
 */
export const learnFromTransaction = (description, category, amount) => {
  // Esto se podría expandir para guardar en localStorage o enviar al backend
  const learningData = JSON.parse(localStorage.getItem('categoryLearning') || '[]')
  
  learningData.push({
    description: description.toLowerCase(),
    category,
    amount,
    timestamp: Date.now()
  })

  // Mantener solo las últimas 100 transacciones para aprendizaje
  if (learningData.length > 100) {
    learningData.splice(0, learningData.length - 100)
  }

  localStorage.setItem('categoryLearning', JSON.stringify(learningData))
}

/**
 * Obtiene el historial de aprendizaje
 */
export const getLearningHistory = () => {
  return JSON.parse(localStorage.getItem('categoryLearning') || '[]')
}

// Exportar reglas para debugging
export { categoryRules, categoryWeights }