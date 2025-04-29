const axios = require('axios');

// Constants for Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBqMIRvkj8zg9xAjhCuFLSTt6kyEkTuN0U'; // Replace with your actual API key
// Update to use the newer model
const GEMINI_MODEL = 'gemini-2.0-flash';
// Update the API URL to use v1beta as shown in the documentation
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Generate a personalized stock explanation using Gemini API
 * @param {Object} stockData - Data about the stock
 * @param {Object} userData - User profile data for personalization
 * @returns {Object} Structured explanation with explanation, risks, and advice
 */
async function generateStockExplanation(stockData, userData) {
  try {
    // Log API key diagnostic (truncated for security)
    const keyPrefix = GEMINI_API_KEY.substring(0, 6);
    const keySuffix = GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4);
    console.log(`Using Gemini API Key: ${keyPrefix}...${keySuffix}`);
    console.log(`Using Gemini Model: ${GEMINI_MODEL}`);
    
    // Construct the prompt for Gemini
    const prompt = constructStockExplanationPrompt(stockData, userData);
    
    // Call Gemini API
    console.log('Sending request to Gemini API...');
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
    
    console.log('Received response from Gemini API');
    
    // Parse the response
    const parsedResponse = parseGeminiResponse(response.data);
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating stock explanation with Gemini:', error);
    
    // Add more detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
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
  // Format key statistics for clarity in the prompt
  const relevantStats = ['marketCap', 'sector', 'industry', 'peRatio', 'dividendYield', 'employees'];
  const formattedStats = Object.entries(stockData.stats || {})
    .filter(([key, value]) => value !== null && value !== undefined && value !== 0 && relevantStats.includes(key))
    .map(([key, value]) => {
      // Format key from camelCase to Title Case
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      // Format the value based on what it represents
      let formattedValue = value;
      if (key === 'marketCap') {
        formattedValue = `$${(Number(value) / 1000000000).toFixed(2)} billion`;
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
You are a financial advisor providing an educational explanation about ${stockData.name} (${stockData.symbol}) to an investor.

COMPANY INFORMATION:
- Name: ${stockData.name || stockData.symbol}
- Symbol: ${stockData.symbol}
- Description: ${stockData.description || `Information about ${stockData.name || stockData.symbol} is limited.`}

${formattedStats ? `KEY COMPANY FACTS:\n${formattedStats}` : 'No detailed company information is available for this stock.'}

USER PROFILE:
- Knowledge Level: ${userData.knowledgeLevel || 'beginner'} (Options: beginner, intermediate, advanced)
- Risk Tolerance: ${userData.riskTolerance || 'moderate'} (Options: conservative, moderate, aggressive)
- ${goalsString}

TASK:
Provide a clear, educational explanation of this company that is tailored to the user's knowledge level. Focus on what the company does and its basic business model rather than current stock movements.

Your response should include THREE distinct sections:

1. EXPLANATION: An educational description of the company that matches the user's knowledge level. For beginners, focus on what the company does and basic business concepts. For intermediate investors, provide context on the company's market position and business model. For advanced investors, include industry analysis and competitive positioning.

2. RISKS: A bullet-point list of 3-4 potential general risks specific to this type of company or industry, considering the user's risk tolerance.

3. ADVICE: One paragraph of educational guidance related to understanding this type of company, appropriate for someone with the user's profile.

FORMATTING INSTRUCTIONS:
- Use Markdown formatting in your response
- Use **bold text** (with double asterisks) for important concepts, terms, or key points
- Structure your response with clear headings and paragraphs
- For lists, use proper Markdown bullet points

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
  
  let explanation, risks, advice;
  
  // Create response based on knowledge level
  if (knowledgeLevel === 'beginner') {
    explanation = `**${companyName}** (${symbol}) is a publicly traded company. When you buy shares of ${symbol}, you're buying a small piece of ownership in the company.

${stockData.description || `No detailed description available for ${companyName}.`}

Companies like **${companyName}** make money through their **business operations**, and as a shareholder, you may benefit from the company's success through stock price appreciation or dividends.`;
    
    risks = [
      "All investments carry **risk**, and you could lose money investing in any stock, including this one.",
      `**${companyName}** might face competition that could affect its business performance.`,
      "**Economic downturns** could negatively impact this company's growth."
    ];
    
    advice = `As a beginner investor with ${riskTolerance} risk tolerance, it's important to **understand what ${companyName} does as a business** before investing. Consider learning about the industry in which they operate and how they make money.`;
  } else if (knowledgeLevel === 'intermediate') {
    explanation = `**${companyName}** (${symbol}) operates in the ${stockData.stats?.sector || 'market'}, specifically within the **${stockData.stats?.industry || 'industry'}** sector.

The company ${stockData.stats?.marketCap ? `has a **market capitalization** of $${(stockData.stats.marketCap / 1000000000).toFixed(2)} billion` : 'market capitalization data is unavailable'}. ${stockData.description || ''}

${stockData.stats?.peRatio ? `Its **P/E ratio** is ${stockData.stats.peRatio}, which is an important valuation metric to consider when analyzing the company.` : 'Valuation metrics are not currently available for this company.'}`;
    
    risks = [
      "The company may face **increasing competition** in its primary markets.",
      "**Regulatory changes** could impact the business model and profitability.",
      "Changes in **consumer preferences** or **technology** could disrupt the industry."
    ];
    
    advice = `For an intermediate investor with ${riskTolerance} risk tolerance, analyze **${companyName}'s business model** and **competitive advantages**. Consider how well the company is positioned against competitors and what factors might affect its long-term growth.`;
  } else {
    // Advanced
    explanation = `**${companyName}** (${symbol}) is positioned in the **${stockData.stats?.sector || 'market'}** sector with operations focused on ${stockData.stats?.industry || 'various industries'}.

The company's fundamentals show ${stockData.stats?.peRatio ? `a **P/E ratio** of ${stockData.stats.peRatio}` : 'unavailable P/E data'} and ${stockData.stats?.dividendYield ? `**dividend yield** of ${stockData.stats.dividendYield}%` : 'no dividend yield'}.

${stockData.description || ''}

When analyzing **${companyName}**, consider its **market positioning**, **capital structure**, and **growth strategy** compared to industry peers.`;
    
    risks = [
      "**Industry disruption** through technological innovation could impact the company's competitive position.",
      "The company's **debt structure** and **capital allocation strategy** merit close analysis.",
      "**Macro-economic factors** may impact growth in the sector broadly."
    ];
    
    advice = `For an advanced investor with ${riskTolerance} risk tolerance, consider examining **${companyName}'s financial statements** in detail, particularly focusing on **revenue growth trends**, **margin expansion opportunities**, and **return on invested capital** when evaluating the company.`;
  }
  
  // Adjust for risk tolerance
  if (riskTolerance === 'conservative') {
    risks.push("This company may have underlying **volatility** that conservative investors should examine closely.");
    advice += " Given your **conservative risk profile**, consider analyzing the stability of earnings and competitive moat before making an investment decision.";
  } else if (riskTolerance === 'aggressive') {
    risks.push("Even for aggressive investors, understanding the company's **growth catalysts** remains important.");
    advice += " With your **aggressive risk profile**, you might be interested in evaluating the company's innovation pipeline and potential for disruptive growth.";
  }
  
  // Return the structured explanation
  return {
    explanation,
    risks,
    advice
  };
}

module.exports = {
  generateStockExplanation
}; 