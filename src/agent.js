const core = require('@actions/core');

async function getAIIssues(token, projectDescription, projectTemplate, categoriesStr, skillsStr, maxIssues, baseIssuesStr) {
  try {
    const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()) : [];
    const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()) : [];
    
    // We fetch category banks from the local parser
    const { getIssueBankForCategory } = require('./parser');
    
    const availableCategories = categories.length > 0 ? categories : ['frontend', 'backend', 'blockchain', 'ml', 'mobile', 'devops'];
    const loadedBanks = {};
    for (const cat of availableCategories) {
        loadedBanks[cat] = getIssueBankForCategory(cat);
    }

    const systemPrompt = `You are an expert technical project manager. You are tasked with generating GitHub issues for a new repository based on the project description.
You MUST include all the issues from the _base/issues.json list provided below. They are mandatory.
Then, selectively choose up to ${maxIssues} TOTAL issues from the provided category banks that best fit the project.
If the requested project stack uses a specific framework, try to find issues from that framework's JSON.
Return the output strictly in JSON format as a JSON object containing an "issues" array.
Format:
{
  "issues": [
    {
      "title": "String",
      "body": "String",
      "labels": ["String"]
    }
  ]
}
`;

    const userPrompt = `
MANDATORY BASE ISSUES:
${baseIssuesStr}

AVAILABLE CATEGORY BANKS:
${JSON.stringify(loadedBanks, null, 2)}

PROJECT DESCRIPTION:
${projectDescription}

${projectTemplate ? `AOSSIE TEMPLATE HINT: ${projectTemplate}` : ''}
${skills.length > 0 ? `REQUIRED SKILLS: ${skills.join(', ')}` : ''}

Please generate the issues JSON array.
`;

    // Wait for the fetch API to fetch models - NodeJS 18+ has native fetch
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      core.setFailed(`GitHub Models API call failed: ${response.status} ${errorText}`);
      return [];
    }

    const data = await response.json();
    const resultObj = JSON.parse(data.choices[0].message.content);
    return resultObj.issues || [];
  } catch (error) {
    core.setFailed(`Error during AI issue generation: ${error.message}`);
    return [];
  }
}

module.exports = {
  getAIIssues
};
