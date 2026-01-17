import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from "../constants";
import { CameraParams } from "../types";

/**
 * Helper to convert numeric camera params into a descriptive prompt
 * that the model can understand better.
 */
const getCameraDescription = (params: CameraParams): string => {
  const { azimuth, elevation, distance } = params;
  
  let hAngle = "front view";
  if (azimuth > 45 && azimuth < 135) hAngle = "right side profile view";
  else if (azimuth >= 135 && azimuth < 225) hAngle = "back view";
  else if (azimuth >= 225 && azimuth < 315) hAngle = "left side profile view";

  let vAngle = "eye-level shot";
  if (elevation > 20) vAngle = "high-angle overhead shot";
  else if (elevation < -20) vAngle = "low-angle worm's-eye view";

  let distDesc = "medium shot";
  if (distance < 0.8) distDesc = "extreme close-up macro shot";
  else if (distance > 1.2) distDesc = "wide angle full body shot";

  return `${hAngle}, ${vAngle}, ${distDesc}`;
};

export const generateNewView = async (
  base64Image: string,
  params: CameraParams
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Clean base64 string if it contains the header
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const cameraDesc = getCameraDescription(params);
    const prompt = `
      Re-imagine this exact scene and subject from a new camera angle.
      
      Target Camera Parameters:
      - Horizontal Rotation (Azimuth): ${params.azimuth} degrees (where 0 is front, 90 is right, 180 is back).
      - Vertical Angle (Elevation): ${params.elevation} degrees.
      - Zoom/Distance: ${params.distance}x normal distance.
      
      Visual Description of Shot: ${cameraDesc}.
      
      Maintain the identity, lighting, and style of the original subject exactly, but rotate the view in 3D space according to these parameters.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity, or detect from input
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        // Nano Banana Pro / Gemini 3 Pro Image specific configs
        imageConfig: {
           aspectRatio: "1:1", // Keeping square for this demo as per typical edit tools
           imageSize: "1K"
        }
      }
    });

    // Extract image from response
    // Check parts for inlineData
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
