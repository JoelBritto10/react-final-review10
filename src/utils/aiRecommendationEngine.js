/**
 * AI-Powered Trip Recommendation Engine (Enhanced)
 * Hybrid scoring model using Preference Match, Group Size, Popularity, Embeddings, 
 * Sentiment Analysis, Budget Prediction, Seasonal Trends, Anomaly Detection, 
 * Collaborative Filtering, and Engagement Prediction
 */

import { cosineSimilarity } from './embeddingUtils';
import { 
  SentimentAnalyzer, 
  SeasonalAnalyzer, 
  BudgetPredictor,
  CollaborativeFilteringEngine,
  AnomalyDetector,
  EngagementPredictor,
  TimeSeriesAnalyzer
} from './advancedMLEngine';

class AIRecommendationEngine {
  constructor(destinationDataset) {
    this.destinations = destinationDataset;
    this.userInteractionHistory = [];
    
    // Initialize advanced ML engines
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.seasonalAnalyzer = new SeasonalAnalyzer();
    this.budgetPredictor = new BudgetPredictor();
    this.collaborativeFiltering = new CollaborativeFilteringEngine();
    this.anomalyDetector = new AnomalyDetector();
    this.engagementPredictor = new EngagementPredictor();
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
  }

  /**
   * Generate AI recommendations based on user profile and filters (ENHANCED)
   * Now includes: Seasonal Analysis, Budget Prediction, Sentiment Analysis, 
   * Engagement Prediction, and Anomaly Detection
   */
  generateRecommendations(userProfile, selectedFilters, userTrips) {
    if (!userProfile) return [];

    // Advanced Analysis Phase
    const seasonalTrends = this.seasonalAnalyzer.analyzeTravelTrends(userTrips);
    const budgetAnalysis = this.budgetPredictor.predictUserBudget(userTrips);
    const travelFrequency = this.timeSeriesAnalyzer.analyzeTravelFrequency(userTrips);
    // Anomaly detection is computed separately in getUserInsights method

    // Score all destinations with enhanced metrics
    const scoredDestinations = this.destinations.map(destination => {
      const scores = {
        preferenceMatch: this.calculatePreferenceMatchScore(destination, userProfile, selectedFilters),
        groupSizeCompatibility: this.calculateGroupSizeScore(destination, userProfile),
        popularity: this.calculatePopularityScore(destination),
        embeddingSimilarity: this.calculateEmbeddingSimilarity(destination, userProfile, userTrips),
        
        // NEW: Advanced ML Scores
        seasonalBoost: this.seasonalAnalyzer.getSeasonalBoost(destination, seasonalTrends),
        budgetMatch: this.budgetPredictor.calculateBudgetMatchScore(destination, budgetAnalysis),
        sentimentAlignment: this.calculateSentimentAlignment(destination, userTrips),
        engagementScore: this.engagementPredictor.calculateEngagementProbability(destination, userProfile, this.userInteractionHistory)
      };

      // Enhanced scoring with AI factors (total now out of 120)
      const totalScore = 
        scores.preferenceMatch * 0.30 +      // 0-12
        scores.groupSizeCompatibility * 0.15 + // 0-3
        scores.popularity * 0.15 +           // 0-3
        scores.embeddingSimilarity * 0.15 +  // 0-3
        scores.seasonalBoost +               // -2 to 5
        scores.budgetMatch +                 // 0-20
        (scores.sentimentAlignment * 10) +   // 0-10
        (scores.engagementScore * 8);        // 0-8

      return {
        ...destination,
        aiScores: scores,
        totalScore: Math.round(totalScore),
        matchPercentage: Math.min(100, Math.round((totalScore / 120) * 100)),
        explanation: this.generateExplanation(destination, scores, userProfile, selectedFilters),
        advancedInsights: {
          seasonalTrends,
          budgetAnalysis,
          travelFrequency,
          engagementPrediction: this.engagementPredictor.predictEngagementScore(destination, userProfile, this.userInteractionHistory)
        }
      };
    });

    // Filter by selected categories if any filters are applied
    let filtered = scoredDestinations;
    if (selectedFilters && selectedFilters.length > 0) {
      filtered = scoredDestinations.filter(dest => 
        dest.categories.some(cat => selectedFilters.includes(cat))
      );
    }

    // Sort by total score descending
    return filtered
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  /**
   * Calculate sentiment alignment (0-1 scale)
   * Analyzes user trip descriptions for sentiment and matches with destination vibe
   */
  calculateSentimentAlignment(destination, userTrips) {
    if (!userTrips || userTrips.length === 0) {
      return 0.5; // Neutral if no history
    }

    const tripSentiments = userTrips
      .filter(trip => trip.description)
      .map(trip => this.sentimentAnalyzer.analyze(trip.description));

    if (tripSentiments.length === 0) return 0.5;

    const avgUserSentiment = tripSentiments.reduce((a, b) => a + b, 0) / tripSentiments.length;
    
    // Analyze destination description
    const destSentiment = this.sentimentAnalyzer.analyze(destination.description || '');
    
    // If both positive or both negative, high alignment
    const sentimentAlignment = 1 - Math.abs(avgUserSentiment - destSentiment) / 2;
    
    return Math.max(0, Math.min(1, sentimentAlignment));
  }

  /**
   * (A) Preference Match Score (0-40 pts)
   * +20 for matching favorite categories
   * +10 for partially related categories
   * +10 if destination is near a favorite region
   */
  calculatePreferenceMatchScore(destination, userProfile, selectedFilters) {
    let score = 0;

    // Category matching
    const userCategories = userProfile.favoriteCategories || [];
    const categoryMatches = destination.categories.filter(cat => userCategories.includes(cat));
    
    if (categoryMatches.length > 0) {
      score += 20; // Exact category match
    } else if (this.hasPartialCategoryMatch(destination.categories, userCategories)) {
      score += 10; // Partial/related match
    }

    // Region matching
    const userRegions = userProfile.favoriteRegions || [];
    const regionMatches = userRegions.filter(region => 
      destination.region.toLowerCase().includes(region.toLowerCase()) ||
      destination.location.toLowerCase().includes(region.toLowerCase())
    );
    
    if (regionMatches.length > 0) {
      score += 10; // Near favorite region
    }

    // Apply selected filters boost
    if (selectedFilters && selectedFilters.length > 0) {
      const filterMatches = selectedFilters.filter(f => 
        destination.categories.includes(f.replace('🏖️ ', '').replace('⛰️ ', '').replace('🏙️ ', '').replace('🎯 ', '').replace('🏛️ ', '').replace('🏃 ', ''))
      );
      if (filterMatches.length > 0) {
        score += 5;
      }
    }

    return Math.min(score, 40);
  }

  /**
   * Helper: Check for partially related categories
   */
  hasPartialCategoryMatch(destCategories, userCategories) {
    const categoryRelations = {
      'Beach': ['Water Sports', 'Relaxation'],
      'Mountain': ['Hiking', 'Adventure', 'Nature'],
      'City': ['Culture', 'Food', 'Architecture'],
      'Adventure': ['Sports', 'Hiking', 'Exploration'],
      'Culture': ['History', 'Art', 'Architecture'],
      'Sports': ['Adventure', 'Fitness', 'Competition']
    };

    return userCategories.some(userCat => {
      const relatedCats = categoryRelations[userCat] || [];
      return destCategories.some(destCat => relatedCats.includes(destCat));
    });
  }

  /**
   * (B) Group Size Compatibility (0-20 pts)
   * +20 if ideal group size ≈ user group size
   * +10 if moderately close
   */
  calculateGroupSizeScore(destination, userProfile) {
    const userGroupSize = userProfile.avgGroupSize || 3;
    const idealGroupSize = destination.idealGroupSize || 4;

    const sizeDifference = Math.abs(userGroupSize - idealGroupSize);

    if (sizeDifference <= 1) {
      return 20; // Perfect match
    } else if (sizeDifference <= 3) {
      return 10; // Moderately close
    }
    return 0; // Not compatible
  }

  /**
   * (C) Popularity Score (0-20 pts)
   * Normalize popularity metrics to 0-20 scale
   */
  calculatePopularityScore(destination) {
    let score = 0;

    // Visitor count score
    const visitorScore = Math.min(10, (destination.monthlyVisitors || 0) / 10000);
    
    // Rating score
    const ratingScore = Math.min(10, ((destination.averageRating || 0) / 5) * 10);
    
    score = (visitorScore + ratingScore) / 2;
    
    // Trend boost
    if (destination.trendingScore > 0.7) {
      score += 3;
    } else if (destination.trendingScore > 0.4) {
      score += 1;
    }

    return Math.min(20, score);
  }

  /**
   * (D) AI Embedding Similarity (0-20 pts)
   * Compare user history + trip descriptions using cosine similarity
   */
  calculateEmbeddingSimilarity(destination, userProfile, userTrips) {
    try {
      if (!userProfile.embedding || !destination.embedding) {
        return 10; // Default score if embeddings not available
      }

      // Calculate similarity between user profile and destination
      const userDestinationSimilarity = cosineSimilarity(
        userProfile.embedding,
        destination.embedding
      );

      // Calculate average similarity with user's past trips
      let tripSimilaritySum = 0;
      if (userTrips && userTrips.length > 0) {
        userTrips.forEach(trip => {
          if (trip.embedding) {
            tripSimilaritySum += cosineSimilarity(trip.embedding, destination.embedding);
          }
        });
      }

      const avgTripSimilarity = userTrips && userTrips.length > 0 
        ? tripSimilaritySum / userTrips.length 
        : 0;

      // Weighted average
      const similarity = (userDestinationSimilarity * 0.6 + avgTripSimilarity * 0.4);
      
      // Normalize to 0-20 scale
      return Math.round(similarity * 20);
    } catch (err) {
      console.error('Error calculating embedding similarity:', err);
      return 10;
    }
  }

  /**
   * Generate AI explanation for why destination matches user (ENHANCED)
   * Now includes seasonal, budget, and sentiment insights
   */
  generateExplanation(destination, scores, userProfile, selectedFilters) {
    const reasons = [];

    // Preference match reason
    if (scores.preferenceMatch >= 30) {
      reasons.push(`Perfect for your ${destination.categories[0]} interests`);
    } else if (scores.preferenceMatch >= 20) {
      reasons.push(`Great match for ${destination.categories.join(', ')} lovers`);
    }

    // Group size reason
    if (scores.groupSizeCompatibility === 20) {
      reasons.push(`Ideal for groups of ${destination.idealGroupSize}`);
    } else if (scores.groupSizeCompatibility === 10) {
      reasons.push(`Works well for your typical group size`);
    }

    // Popularity reason
    if (scores.popularity >= 15) {
      reasons.push(`⭐ Highly popular destination`);
    }

    // Embedding similarity reason
    if (scores.embeddingSimilarity >= 15) {
      reasons.push(`Aligns with your travel style`);
    }

    // NEW: Seasonal reason
    if (scores.seasonalBoost > 3) {
      reasons.push(`🌤️ Perfect time to visit based on your seasonal preferences`);
    }

    // NEW: Budget reason
    if (scores.budgetMatch === 20) {
      reasons.push(`💰 Matches your typical budget`);
    } else if (scores.budgetMatch >= 10) {
      reasons.push(`Budget-friendly option`);
    }

    // NEW: Sentiment reason
    if (scores.sentimentAlignment > 0.7) {
      reasons.push(`😊 Aligns with your travel vibe`);
    }

    // Selected filter reason
    if (selectedFilters && selectedFilters.length > 0) {
      const matchedFilter = selectedFilters.find(f => 
        destination.categories.includes(f.replace(/^[^a-zA-Z]+/, '').trim())
      );
      if (matchedFilter) {
        reasons.push(`You filtered for ${matchedFilter}`);
      }
    }

    // Default reasons if needed
    if (reasons.length === 0) {
      reasons.push('Recommended based on AI analysis');
      reasons.push('Great destination for travelers like you');
    }

    return reasons.slice(0, 4); // Return up to 4 reasons
  }

  /**
   * Generate travel persona based on user history (ENHANCED)
   * Now includes travel frequency, budget category, and sentiment
   */
  generateTravelPersona(userProfile, userTrips) {
    if (!userProfile || !userTrips || userTrips.length === 0) {
      return 'Explorer'; // Default
    }

    const categories = userProfile.favoriteCategories || [];
    const budgetAnalysis = this.budgetPredictor.predictUserBudget(userTrips);
    const travelFrequency = this.timeSeriesAnalyzer.analyzeTravelFrequency(userTrips);
    
    let persona = 'Explorer';
    
    // Category-based personas
    if (categories.includes('Adventure') && categories.includes('Sports')) {
      persona = 'Thrill Seeker';
    } else if (categories.includes('Culture') && categories.includes('History')) {
      persona = 'Cultural Enthusiast';
    } else if (categories.includes('Beach') && categories.includes('Relaxation')) {
      persona = 'Beach Lover';
    } else if (categories.includes('Mountain') && categories.includes('Nature')) {
      persona = 'Nature Explorer';
    } else if (categories.includes('City') && categories.includes('Food')) {
      persona = 'Urban Gourmet';
    }

    // Enhance with frequency and budget
    if (travelFrequency.frequency === 'Very Frequent') {
      persona += ' (Jet Setter)';
    } else if (budgetAnalysis.budgetCategory === 'Luxury') {
      persona += ' (Premium)';
    } else if (budgetAnalysis.budgetCategory === 'Budget') {
      persona += ' (Budget-Conscious)';
    }

    return persona;
  }

  /**
   * Generate comprehensive user insights
   */
  generateUserInsights(userProfile, userTrips) {
    return {
      travelPersona: this.generateTravelPersona(userProfile, userTrips),
      seasonalTrends: this.seasonalAnalyzer.analyzeTravelTrends(userTrips),
      budgetAnalysis: this.budgetPredictor.predictUserBudget(userTrips),
      travelFrequency: this.timeSeriesAnalyzer.analyzeTravelFrequency(userTrips),
      anomalies: this.anomalyDetector.detectAnomalies(userTrips)
    };
  }

  /**
   * Track user interaction for learning
   */
  trackInteraction(destinationId, action, timestamp = Date.now()) {
    this.userInteractionHistory.push({
      destinationId,
      action, // 'view', 'click', 'save', 'book'
      timestamp
    });
  }

  /**
   * Get recommendations sorted by user's recent interactions
   */
  getPersonalizedRecommendations(userProfile, selectedFilters, userTrips) {
    const recommendations = this.generateRecommendations(userProfile, selectedFilters, userTrips);

    // Boost score for recently interacted destinations
    return recommendations.map(rec => {
      const interaction = this.userInteractionHistory.find(i => i.destinationId === rec.id);
      if (interaction) {
        // Slight boost for previously interacted destinations
        rec.totalScore += 2;
        rec.matchPercentage = Math.min(100, rec.matchPercentage + 2);
      }
      return rec;
    }).sort((a, b) => b.totalScore - a.totalScore);
  }
}

export default AIRecommendationEngine;
