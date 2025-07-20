/**
 * Enhanced version of scoreElement that puts stronger emphasis on proximity to last clicked element
 * @param {Object} element - The element object
 * @param {string} searchTerm - The search term
 * @param {string} commandType - The command type (click/type)
 * @param {Object} previousState - Contains previous clicks and coordinate information
 * @returns {number} - Score between 0-100 (higher is better)
 */
export const scoreElement = (element, searchTerm, commandType, previousState = {}) => {
  if (!element || !element.name) return 0;
  
  let score = 0;
  const elementName = element.name.toLowerCase();
  const elementType = (element.type || '').toLowerCase();
  
  // Base score for having a name
  score += 20;
  
  // Search term matching logic
  if (searchTerm) {
    // Exact match gets highest priority
    if (elementName === searchTerm) {
      score += 60;
    } 
    // Starts with search term
    else if (elementName.startsWith(searchTerm)) {
      score += 40;
    }
    // Contains search term as a word
    else if (elementName.includes(` ${searchTerm} `) || 
             elementName.startsWith(`${searchTerm} `) || 
             elementName.endsWith(` ${searchTerm}`)) {
      score += 35;
    }
    // Contains search term anywhere
    else if (elementName.includes(searchTerm)) {
      score += 30;
    }
  }
  
  // Boost score based on element type for click commands
  if (commandType === 'click') {
    if (element.interactivity === true || elementType === 'text'){
      score += 15;  
    }
  } 
  else if (commandType === 'type') {
    if (elementType === 'icon' || elementType === 'textarea') {
      score += 15;
    }
  }
  else if (commandType === 'verify' || commandType === 'get' ) {
    if (elementType === 'text') {
      score += 30;  // Major boost for text elements
    }
    
    if (searchTerm && elementName.includes(searchTerm)) {
      score += 25;
    }

    if (element.interactivity === true) {
      score -= 10;
    }
  }
  
  // Elements with text content that matches search term get a boost
  if (searchTerm && element.text && element.text.toLowerCase().includes(searchTerm)) {
    score += 8;
  }
  
  // Visible elements get priority
  if (element.visible !== false) {
    score += 5;
  }
  
  // *** ENHANCED PROXIMITY LOGIC ***
  // Proximity to last click gets MUCH higher importance
  if (previousState.lastClickCoordinates && element.click_point) {
    const [lastX, lastY] = previousState.lastClickCoordinates;
    const [elementX, elementY] = element.click_point;
    
    // Calculate distance using Euclidean distance
    const distance = Math.sqrt(
      Math.pow(elementX - lastX, 2) + 
      Math.pow(elementY - lastY, 2)
    ); 
    let proximityScore = 0;
    
    // Dramatically enhanced proximity scoring with different tiers
    if (distance < 5) {
      // Almost exact location match - maximum proximity boost
      proximityScore = 70;
      // console.log(`  VERY HIGH PROXIMITY: ${proximityScore} points (distance < 5px)`);
    } else if (distance < 50) {
      // Very close proximity - high boost with sharp falloff
      proximityScore = Math.max(0, 65 - Math.pow(distance/10, 1.5));
      // console.log(`  HIGH PROXIMITY: ${proximityScore.toFixed(2)} points (distance < 50px)`);

    } else if (distance < 150) {
      // Moderate proximity - moderate boost
      proximityScore = Math.max(0, 40 - Math.pow(distance/30, 1.5));
      // console.log(`  MODERATE PROXIMITY: ${proximityScore.toFixed(2)} points (distance < 150px)`);
    } else if (distance < 300) {
      // Further away but still in view
      proximityScore = Math.max(0, 20 - (distance / 30));
      // console.log(`  LOW PROXIMITY: ${proximityScore.toFixed(2)} points (distance < 300px)`);
    } else {
      // Far but still somewhat relevant
      proximityScore = Math.max(0, 10 - (distance / 100));
      // console.log(`  DISTANT: ${proximityScore.toFixed(2)} points (distance >= 300px)`);
    }
    
    score += proximityScore;
    // console.log(`  Current total score after proximity: ${score.toFixed(2)}`);
  }
  
  // Previously clicked elements boost logic remains, but with adjusted values
  if (previousState.previouslySelectedElements) {
    // Check exact element match by coordinates and name
    if (element.click_point && element.name) {
      const x = Math.round(element.click_point[0]);
      const y = Math.round(element.click_point[1]);
      const exactKey = `${element.name.toLowerCase()}_${x}_${y}`;
      
      if (previousState.previouslySelectedElements[exactKey]) {
        const prevElement = previousState.previouslySelectedElements[exactKey];
        
        // Huge boost if this was the last executed element
        if (prevElement.lastExecutedElement) {
          score += 80; // Increased from 70
        } else {
          const recencyBonus = Math.min(25, Math.max(0, 25 - ((Date.now() - prevElement.lastSelected) / 60000)));
          const frequencyBonus = Math.min(20, prevElement.count * 4); // Increased from 15, count*3
          score += recencyBonus + frequencyBonus;
        }
      } else {
        // Check if any element with the same name was previously clicked
        const nameMatchKeys = Object.keys(previousState.previouslySelectedElements)
          .filter(key => key.startsWith(element.name.toLowerCase() + '_'));
        
        if (nameMatchKeys.length > 0) {
          // Find the closest matching element by coordinates
          let closestDist = Infinity;
          let closestElement = null;
          
          for (const key of nameMatchKeys) {
            const prevElement = previousState.previouslySelectedElements[key];
            if (prevElement.coordinates) {
              const dist = Math.sqrt(
                Math.pow(prevElement.coordinates[0] - x, 2) + 
                Math.pow(prevElement.coordinates[1] - y, 2)
              );
              
              if (dist < closestDist) {
                closestDist = dist;
                closestElement = prevElement;
              }
            }
          }
          
          if (closestElement) {
            // Boost based on proximity to previously clicked element with same name
            if (closestDist < 20) {
              // Very close - likely the same element but coordinates shifted slightly
              score += closestElement.lastExecutedElement ? 50 : 30; // Increased from 40/25
            } else if (closestDist < 100) {
              // Somewhat close - could be related
              score += closestElement.lastExecutedElement ? 30 : 15; // Increased from 20/10
            }
          }
        }
      }
    }
  }
  
  // Ensure score doesn't exceed 100
  return Math.min(score, 100);
};

/**
* Creates a unique key for an element based on name and position
* @param {Object} element - The element object
* @returns {string} - A unique identifier for the element
*/
export const createElementUniqueKey = (element) => {
if (!element || !element.name) return '';

const name = element.name.toLowerCase();
const x = element.click_point ? Math.round(element.click_point[0]) : 0;
const y = element.click_point ? Math.round(element.click_point[1]) : 0;

return `${name}_${x}_${y}`;
};

/**
* Groups elements by their names and identifies duplicates
* @param {Array} elements - The array of elements
* @returns {Object} - Object with name groups and isDuplicate flags
*/
export const identifyDuplicates = (elements) => {
  const nameGroups = {};

  // Group elements by name
  elements.forEach(element => {
    if (!element.name) return;
    
    const lowerName = element.name.toLowerCase();
    if (!nameGroups[lowerName]) {
      nameGroups[lowerName] = [];
    }
    nameGroups[lowerName].push(element);
  });

  // Add isDuplicate flag and position number to each element
  const elementsWithDuplicateFlag = elements.map(element => {
    if (!element.name) return { ...element, isDuplicate: false, positionNumber: 0 };
    
    const lowerName = element.name.toLowerCase();
    const isDuplicate = nameGroups[lowerName].length > 1;
    
    // Assign position numbers (1-based) for elements with the same name
    let positionNumber = 0;
    if (isDuplicate) {
    //   const sortedByPosition = nameGroups[lowerName].slice().sort((a, b) => {
    //   const aY = a.click_point ? a.click_point[1] : Infinity;
    //   const bY = b.click_point ? b.click_point[1] : Infinity;
      
    //   if (aY !== bY) {
    //     return aY - bY;  // primary: vertical position
    //   }
      
    //   // If Y is same, sort by X (horizontal)
    //   const aX = a.click_point ? a.click_point[0] : Infinity;
    //   const bX = b.click_point ? b.click_point[0] : Infinity;
      
    //   return aX - bX;
    // });

      // Sort duplicates by Y coordinate (click_point[1]) - top to bottom

      const sortedByY = nameGroups[lowerName].slice().sort((a, b) => {
        const aY = a.click_point ? a.click_point[1] : Infinity;
        const bY = b.click_point ? b.click_point[1] : Infinity;
        return aY - bY;
      });

      // Assign position number based on sorted index
      positionNumber = sortedByY.findIndex(el => el.id === element.id) + 1;

    }
    
    return { ...element, isDuplicate, positionNumber };
  });

  return { nameGroups, elementsWithDuplicateFlag };
};

/**
* Creates a descriptive display name for elements
* @param {Object} element - The element object
* @param {number} index - The element's index
* @param {boolean} isDuplicate - Whether element has duplicates
* @returns {string} - A descriptive display name
*/
export const createDisplayName = (element, index, isDuplicate) => {
  if (!element.name) return 'Unknown Element';
  if (!isDuplicate) return element.name;

  // Create more descriptive names for duplicates, now with position number
  if (element.positionNumber) {
    return `${element.name} position${element.positionNumber}`;
  }
  
  // Fallback to the original logic if positionNumber is not available
  const elementType = element.type || element.tag || 'element';
  const displayName = `${element.name} (${elementType}`;

  // Add position info
  const positionInfo = element.click_point ? 
    `, x:${Math.round(element.click_point[0])}, y:${Math.round(element.click_point[1])}` : 
    `, pos: ${index + 1}`;

  // Add text content preview if available
  const textPreview = element.text ? `, text: "${element.text.substring(0, 10)}${element.text.length > 10 ? '...' : ''}"` : '';

  return `${displayName}${positionInfo}${textPreview})`;
};
/**
* Returns enhanced elements with relevance scores for suggestions
* @param {Array} elements - All available elements
* @param {string} searchTerm - The search term to match against
* @param {string} commandType - The command type (click/type)
* @param {Object} state - Object containing previously selected elements and last click coordinates
* @returns {Array} - Sorted array of enhanced elements
*/
export const getSuggestedElements = (elements, searchTerm, commandType, state = {}) => {
  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return [];
  }
  
  const { previouslySelectedElements = {}, lastClickCoordinates = null } = state;
  const lowerSearchTerm = searchTerm ? searchTerm.toLowerCase() : '';
  
  // Score each element
  const scoredElements = elements.map((element, index) => {
    const score = scoreElement(element, lowerSearchTerm, commandType, { 
      previouslySelectedElements, 
      lastClickCoordinates 
    });
    
    return { ...element, score, originalIndex: index };
  });
  
  // Identify duplicates
  const { elementsWithDuplicateFlag } = identifyDuplicates(scoredElements);
  
  // Sort by score (descending)
  const sortedElements = elementsWithDuplicateFlag.sort((a, b) => b.score - a.score);


  // Enhance with display names and usage info
  const result = sortedElements.map((element, index) => {
    const displayName = createDisplayName(element, index, element.isDuplicate);
    
    // Check if this element was previously used
    let usageInfo = null;
    
    if (element.click_point && element.name) {
      const x = Math.round(element.click_point[0]);
      const y = Math.round(element.click_point[1]);
      const exactKey = `${element.name.toLowerCase()}_${x}_${y}`;
      
      // Check for exact coordinate match
      if (previouslySelectedElements[exactKey]) {
        if (previouslySelectedElements[exactKey].lastExecutedElement) {
          usageInfo = 'Last executed element';
        } else if (previouslySelectedElements[exactKey].count > 1) {
          usageInfo = `Used ${previouslySelectedElements[exactKey].count} times`;
        }
      } else {
        // Check for proximity matches with the same name
        const nameMatchKeys = Object.keys(previouslySelectedElements)
          .filter(key => key.startsWith(element.name.toLowerCase() + '_'));
        
        if (nameMatchKeys.length > 0) {
          // Find the closest previous element by coordinates
          let closestDist = Infinity;
          let closestElement = null;
          
          for (const key of nameMatchKeys) {
            const prevElement = previouslySelectedElements[key];
            if (prevElement.coordinates) {
              const dist = Math.sqrt(
                Math.pow(prevElement.coordinates[0] - x, 2) + 
                Math.pow(prevElement.coordinates[1] - y, 2)
              );
              
              if (dist < closestDist) {
                closestDist = dist;
                closestElement = prevElement;
              }
            }
          }
          
          // If very close to a previously clicked element with same name
          if (closestElement && closestDist < 15) {
            if (closestElement.lastExecutedElement) {
              usageInfo = 'Likely last executed element';
            }
          }
        }
      }
    }
    
    return { ...element, displayName, usageInfo };
  });
/*  
  console.log(`\n--- FINAL TOP 10 ELEMENTS WITH DISPLAY NAMES ---`);
  result.slice(0, 10).forEach((element, index) => {
    console.log(`#${index + 1}: ${element.displayName} (Score: ${element.score.toFixed(2)})${element.usageInfo ? ` - ${element.usageInfo}` : ''}`);
  });
*/  
  // Return top matches limited to 20
  return result.slice(0, 20);
};

/**
* Helper function to extract last click coordinates from test steps
* @param {Array} steps - The test steps array
* @returns {Array|null} - [x, y] or null if no coordinates found
*/
export const getLastClickCoordinates = (steps) => {
// Loop backwards through steps to find the last successful click action
for (let i = steps.length - 1; i >= 0; i--) {
  const step = steps[i];
  if (step.status === 'complete' && 
      step.description.toLowerCase().startsWith('click') && 
      step.selectedElement && 
      step.selectedElement.click_point) {
    return step.selectedElement.click_point;
  }
}
return null;
};

/**
* Creates an enhanced descriptive display name for elements with spatial relationship info
* @param {Object} element - The element object
* @param {number} index - The element's index
* @param {boolean} isDuplicate - Whether element has duplicates
* @param {string} proximityIndicator - Proximity to the last click
* @param {Array} lastClickCoordinates - Coordinates of the last click
* @returns {string} - A descriptive display name
*/
export const createEnhancedDisplayName = (element, index, isDuplicate, proximityIndicator, lastClickCoordinates) => {
  if (!element.name) return 'Unknown Element';
  if (!isDuplicate && !proximityIndicator) return element.name;
  
  // Use position number for duplicate elements
  if (isDuplicate && element.positionNumber) {
    // Simple format for duplicates
    const baseName = `${element.name} position${element.positionNumber}`;
    
    // Optionally add proximity indicator if available
    if (proximityIndicator) {
      return `${baseName} (${proximityIndicator})`;
    }
    return baseName;
  }
  
  // Create base name using original logic
  const elementType = element.type || element.tag || 'element';
  let displayName = `${element.name} (${elementType}`;
  
  // Rest of the original function...
  // Add position info
  if (element.click_point) {
    const [x, y] = element.click_point;
    displayName += `, x:${Math.round(x)}, y:${Math.round(y)}`;
    
    // Add spatial relationship relative to last click if available
    if (lastClickCoordinates && proximityIndicator) {
      const [lastX, lastY] = lastClickCoordinates;
      const directionX = x > lastX ? 'right' : (x < lastX ? 'left' : '');
      const directionY = y > lastY ? 'below' : (y < lastY ? 'above' : '');
      const direction = directionX && directionY 
        ? `${directionY}-${directionX}` 
        : (directionX || directionY);
      
      if (direction) {
        displayName += `, ${direction}`;
      }
    }
  } else {
    displayName += `, pos: ${index + 1}`;
  }
  
  // Add text content preview if available
  const textPreview = element.text 
    ? `, text: "${element.text.substring(0, 10)}${element.text.length > 10 ? '...' : ''}"` 
    : '';
  
  return `${displayName}${textPreview})`;
};