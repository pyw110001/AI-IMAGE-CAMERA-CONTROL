export interface CameraParams {
  azimuth: number;   // Horizontal rotation (0-360)
  elevation: number; // Vertical angle (-90 to 90)
  distance: number;  // Zoom factor (0.5 to 2.0)
}

export interface GenerationState {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
}

export enum CameraPreset {
  FRONT = 'Front',
  LEFT = 'Left',
  RIGHT = 'Right',
  TOP = 'Top',
  BOTTOM = 'Bottom'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}