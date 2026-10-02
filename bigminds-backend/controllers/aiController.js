const { catchAsync } = require("../middleware/errorHandler");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const axios = require("axios");

// AI Course Helper Chat
exports.courseHelper = catchAsync(async (req, res) => {
  const { courseId, message, conversationHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message is required",
    });
  }

  // Get course details
  const course = await Course.findById(courseId)
    .populate("instructor", "firstName lastName");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // Check if user is enrolled (for students)
  if (req.user.role === "student") {
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to use AI chat",
      });
    }
  }

  // Build context for AI
  const courseContext = `
Course Title: ${course.title}
Category: ${course.category}
Class: ${course.class}
Level: ${course.level}
Description: ${course.description}
Learning Outcomes: ${course.learningOutcomes?.join(", ") || "N/A"}
What You Will Learn: ${course.whatYouWillLearn?.join(", ") || "N/A"}
Instructor: ${course.instructorName}
  `.trim();

  // Build conversation with context
  const systemPrompt = `You are an AI tutor helping students with the course "${course.title}". 
You should:
- Explain concepts clearly based on the course content
- Help solve problems related to the course
- Answer questions about the course material
- Provide examples and explanations
- NOT answer questions unrelated to the course
- Be encouraging and supportive

Course Information:
${courseContext}

Keep your responses concise, clear, and focused on the course content.`;

  // Prepare messages for AI
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  let aiResponse = null;
  let providerUsed = "";

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Try OpenAI if key is present
    if (openaiKey) {
      try {
        const openaiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
          },
          {
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10s timeout
          }
        );
        aiResponse = openaiResponse.data.choices[0].message.content;
        providerUsed = "OpenAI";
      } catch (err) {
        console.warn("OpenAI API call failed, attempting fallback:", err.message);
      }
    }

    // 2. Try Groq if OpenAI was skipped or failed
    if (!aiResponse && groqKey) {
      try {
        const groqResponse = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
          },
          {
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
        aiResponse = groqResponse.data.choices[0].message.content;
        providerUsed = "Groq";
      } catch (err) {
        console.warn("Groq API call failed:", err.message);
      }
    }

    // 3. Return response if successful
    if (aiResponse) {
      return res.status(200).json({
        success: true,
        data: {
          response: aiResponse,
          courseId,
          timestamp: new Date().toISOString(),
        },
        message: `AI response generated successfully (${providerUsed})`,
      });
    }

    // 4. Default mock response if both APIs fail or are skipped
    const mockResponse = `I understand you're asking about this course. 

Based on the course information for "${course.title}":
- Category: ${course.category}
- Instructor: ${course.instructorName || "Instructor"}
- Level: ${course.level}
- Description: ${course.description}

Here's a helpful mock explanation: I can explain any concepts covered in the syllabus, help you debug code, or answer theory questions. 
(Note: To enable active AI chat responses, please make sure a valid GROQ_API_KEY or OPENAI_API_KEY is defined in your server's .env file.)`;

    return res.status(200).json({
      success: true,
      data: {
        response: mockResponse,
        courseId,
        timestamp: new Date().toISOString(),
      },
      message: "AI response (mock mode – configured keys are failing or missing)",
    });

  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(200).json({
      success: true,
      data: {
        response: `I'm here to help with questions about ${course.title}. However, I'm experiencing some technical difficulties. Please try again in a moment, or contact your instructor for immediate assistance.`,
        courseId,
        timestamp: new Date().toISOString(),
        error: "AI service temporarily unavailable",
      },
      message: "AI response generated (fallback mode)",
    });
  }
});

