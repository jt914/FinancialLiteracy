const axios = require('axios');

// Constants for Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'; // Replace with your actual API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate a personalized stock explanation using Gemini API
 * @param {Object} stockData - Data about the stock
 * @param {Object} userData - User profile data for personalization
 * @returns {Object} Structured explanation with explanation, risks, and advice
 */
async function generateStockExplanation(stockData, userData) {
  try {
    // Construct the prompt for Gemini
    const prompt = constructStockExplanationPrompt(stockData, userData);
    
    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent output
          maxOutputTokens: 1024,
        }
      }
    );
    
    // Parse the response
    const parsedResponse = parseGeminiResponse(response.data);
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating stock explanation with Gemini:', error);
    
    // Generate fallback explanation if API call fails
    return generateFallbackExplanation(stockData, userData);
  }
}

/**
 * Construct a good prompt for the Gemini API
 * @param {Object} stockData - Data about the stock
 * @param {Object} userData - User profile data for personalization
 * @returns {String} The constructed prompt
 */
function constructStockExplanationPrompt(stockData, userData) {
  // Format data for clarity in the prompt
  const formattedStats = Object.entries(stockData.stats || {})
    .filter(([_, value]) => value !== null && value !== undefined && value !== 0)
    .map(([key, value]) => {
      // Format key from camelCase to Title Case
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      // Format the value based on what it represents
      let formattedValue = value;
      if (key.includes('price') || key.includes('value') || key.includes('cap')) {
        formattedValue = `$${Number(value).toFixed(2)}`;
      } else if (key.includes('percent') || key.includes('ratio') || key.includes('yield')) {
        formattedValue = `${Number(value).toFixed(2)}%`;
      } else if (key.includes('volume')) {
        formattedValue = value.toLocaleString();
      }
      
      return `${formattedKey}: ${formattedValue}`;
    })
    .join('\n');
  
  // Construct goals string if available
  const goalsString = userData.financialGoals && userData.financialGoals.length > 0
    ? `Their financial goals include: ${userData.financialGoals.join(', ')}.`
    : 'No specific financial goals have been specified.';
  
  // Construct the prompt
  return `
You are a financial advisor providing a personalized explanation about ${stockData.name} (${stockData.symbol}) to an investor.

STOCK INFORMATION:
- Current Price: $${stockData.price.toFixed(2)}
- Price Change: ${stockData.priceChange >= 0 ? '+' : ''}$${stockData.priceChange.toFixed(2)} (${stockData.priceChangePercent.toFixed(2)}%)
- Description: ${stockData.description || `Information about ${stockData.name || stockData.symbol} is limited.`}

${formattedStats ? `KEY STATISTICS:\n${formattedStats}` : 'No detailed statistics are available for this stock.'}

USER PROFILE:
- Knowledge Level: ${userData.knowledgeLevel || 'beginner'} (Options: beginner, intermediate, advanced)
- Risk Tolerance: ${userData.riskTolerance || 'moderate'} (Options: conservative, moderate, aggressive)
- ${goalsString}

TASK:
Provide a comprehensive yet accessible explanation of this stock that is tailored to the user's knowledge level, risk tolerance, and financial goals. Your response should include THREE distinct sections:

1. EXPLANATION: An educational explanation of the stock that matches the user's knowledge level. For beginners, focus on fundamentals. For intermediate investors, provide more context on the company's position in the market. For advanced investors, include more sophisticated analysis.

2. RISKS: A bullet-point list of 3-5 potential risks specific to this stock, considering the user's risk tolerance.

3. ADVICE: One paragraph of guidance related to this stock that is appropriate for someone with the user's profile.

Format your response as a structured JSON with these three keys: "explanation", "risks" (as an array), and "advice".
`;
}

/**
 * Parse the Gemini API response
 * @param {Object} response - The raw response from Gemini API
 * @returns {Object} Structured explanation with explanation, risks, and advice
 */
function parseGeminiResponse(response) {
  try {
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('Empty response from Gemini API');
    }
    
    const content = response.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const responseText = content.parts[0].text;
    
    // Try to parse JSON directly if the API returned it
    try {
      // Look for JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present
        if (!parsedJson.explanation || !parsedJson.risks || !parsedJson.advice) {
          throw new Error('Missing required fields in JSON response');
        }
        
        return {
          explanation: parsedJson.explanation,
          risks: Array.isArray(parsedJson.risks) ? parsedJson.risks : [parsedJson.risks],
          advice: parsedJson.advice
        };
      }
    } catch (jsonError) {
      console.error('Error parsing JSON from Gemini response:', jsonError);
      // Continue to manual parsing
    }
    
    // If JSON parsing fails, try to extract sections manually
    // Extract explanation (everything between EXPLANATION/Explanation and RISKS/Risks)
    const explanationMatch = responseText.match(/(?:EXPLANATION|Explanation)[:\s]+([\s\S]+?)(?=(?:RISKS|Risks)[:\s]+)/i);
    
    // Extract risks (everything between RISKS/Risks and ADVICE/Advice)
    const risksText = responseText.match(/(?:RISKS|Risks)[:\s]+([\s\S]+?)(?=(?:ADVICE|Advice)[:\s]+)/i);
    const risksArray = risksText && risksText[1] ? 
      risksText[1].split(/\n-|\n\d+\.|\n\*/).filter(item => item.trim().length > 0).map(item => item.trim()) : 
      [];
    
    // Extract advice (everything after ADVICE/Advice)
    const adviceMatch = responseText.match(/(?:ADVICE|Advice)[:\s]+([\s\S]+)/i);
    
    return {
      explanation: explanationMatch && explanationMatch[1] ? explanationMatch[1].trim() : 'No explanation provided.',
      risks: risksArray.length > 0 ? risksArray : ['No specific risks identified.'],
      advice: adviceMatch && adviceMatch[1] ? adviceMatch[1].trim() : 'No advice provided.'
    };
    
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return {
      explanation: 'We experienced an issue processing the AI-generated explanation.',
      risks: ['Technical issues prevented a complete risk assessment.'],
      advice: 'Please try again later or consult a financial advisor for personalized advice.'
    };
  }
}

/**
 * Generate a fallback explanation if the API call fails
 * @param {Object} stockData - Data about the stock
 * @param {Object} userData - User profile data for personalization
 * @returns {Object} Structured explanation with explanation, risks, and advice
 */
function generateFallbackExplanation(stockData, userData) {
  const symbol = stockData.symbol;
  const companyName = stockData.name || `${symbol} Inc.`;
  const knowledgeLevel = userData.knowledgeLevel || 'beginner';
  const riskTolerance = userData.riskTolerance || 'moderate';
  const yearlyChange = stockData.priceChangePercent || 0;
  
  let explanation, risks, advice;
  
  // Create response based on knowledge level
  if (knowledgeLevel === 'beginner') {
    explanation = `<p>${companyName} (${symbol}) is a publicly traded company. When you buy shares of ${symbol}, you're buying a small piece of ownership in the company.</p>
      <p>Over the past year, ${symbol} has ${yearlyChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(yearlyChange).toFixed(2)}%. This means if you invested $1,000 a year ago, it would be worth about $${(1000 * (1 + yearlyChange/100)).toFixed(2)} today.</p>
      <p>${stockData.description || `No detailed description available for ${companyName}.`}</p>`;
    
    risks = [
      "All investments carry risk, and you could lose money investing in any stock, including this one.",
      `${companyName} might face competition that could affect its business performance.`,
      "Economic downturns could negatively impact this company's growth."
    ];
    
    advice = `As a beginner investor with ${riskTolerance} risk tolerance, consider learning more about diversification and only invest money you can afford to lose.`;
  } else if (knowledgeLevel === 'intermediate') {
    explanation = `<p>${companyName} (${symbol}) has shown ${yearlyChange >= 0 ? 'positive' : 'negative'} performance over the past year, with a ${Math.abs(yearlyChange).toFixed(2)}% ${yearlyChange >= 0 ? 'gain' : 'loss'}.</p>
      <p>The company ${stockData.stats.marketCap ? `has a market capitalization of $${(stockData.stats.marketCap / 1000000000).toFixed(2)} billion` : 'market capitalization data is unavailable'}. ${stockData.description || ''}</p>
      <p>Current P/E ratio is ${stockData.stats.peRatio || 'not available'}, which ${stockData.stats.peRatio > 20 ? 'might be considered high by some value investors' : 'is in a reasonable range for value consideration'}.</p>`;
    
    risks = [
      "The company may face increasing competition in its primary markets.",
      "Regulatory changes could impact the business model and profitability.",
      `${symbol}'s valuation metrics might be higher than industry averages, suggesting potential overvaluation.`
    ];
    
    advice = `For an intermediate investor with ${riskTolerance} risk tolerance, consider analyzing the company's financial ratios compared to industry averages before making an investment decision.`;
  } else {
    // Advanced
    explanation = `<p>${companyName} (${symbol}) has demonstrated a ${yearlyChange.toFixed(2)}% return over the trailing 12 months.</p>
      <p>The company's fundamentals show ${stockData.stats.peRatio ? `a P/E ratio of ${stockData.stats.peRatio}` : 'unavailable P/E data'} and ${stockData.stats.dividendYield ? `dividend yield of ${stockData.stats.dividendYield}%` : 'no dividend yield'}.</p>
      <p>Technical indicators suggest ${yearlyChange > 10 ? 'momentum characteristics' : 'potential consolidation patterns'} with recent volume patterns indicating ${stockData.stats.volume > (stockData.stats.avgVolume || 0) ? 'above-average interest' : 'below-average participation'}.</p>
      <p>${stockData.description || ''}</p>`;
    
    risks = [
      "Current technical indicators may suggest the stock is approaching resistance levels.",
      "The company's debt structure might pose challenges in a rising interest rate environment.",
      "Forward P/E ratios indicate potential overvaluation compared to expected growth rates."
    ];
    
    advice = `For an advanced investor with ${riskTolerance} risk tolerance, consider examining options strategies or alternative position sizing if you're looking to establish a position in this security.`;
  }
  
  // Adjust for risk tolerance
  if (riskTolerance === 'conservative') {
    risks.push("This stock may not be suitable for very conservative investors seeking capital preservation.");
    advice += " Given your conservative risk profile, consider allocating only a small portion of your portfolio to individual stocks like this one.";
  } else if (riskTolerance === 'aggressive') {
    risks.push("Even for aggressive investors, position sizing and timing remain important considerations.");
    advice += " With your aggressive risk profile, you might be comfortable with a larger position, but still ensure proper diversification across your portfolio.";
  }
  
  return {
    explanation,
    risks,
    advice
  };
}

module.exports = {
  generateStockExplanation
}; 