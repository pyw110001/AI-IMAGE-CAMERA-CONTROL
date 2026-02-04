# Gemini 3D Camera Booth (AI Virtual Photographer)

这是一个基于 Google Gemini 3 Pro Image Preview 模型的 AI 摄影重构工具。它允许用户上传一张照片，通过交互式的 3D 相机可视化组件调整拍摄角度（方位角、仰角、距离），然后让 AI 从新的视角“重拍”这张照片。

## 📋 核心需求与设计规范 (Prompt For AI)

**如果您需要在其他项目中复现类似功能，可以将以下需求描述发送给 AI：**

> **项目目标**：开发一个基于 React + TypeScript 的 "AI 虚拟摄影棚" Web 应用。
>
> **核心功能需求**：
> 1.  **图片上传**：允许用户通过拖拽或点击上传一张参考图片。
> 2.  **3D 相机控制组件 (Camera Visualizer)**：
>     *   需要一个可视化的 3D 示意图（使用 SVG 或 Canvas），展示“相机”相对于“主体”的位置。
>     *   **交互方式**：用户可以直接在 3D 图上拖拽来旋转轨道（Orbit Control），或者拖拽手柄来调整方位角 (Azimuth) 和仰角 (Elevation)。
>     *   **防裁切设计**：3D 场景的缩放比例必须适配容器大小，确保旋转到任何角度时，网格和轨道都不会超出视图边界（Scale Factor set to ~130 for 600x400 container）。
> 3.  **参数控制**：提供三个维度的精确滑块控制：
>     *   **Azimuth (方位角)**: 0-360度。
>     *   **Elevation (仰角)**: -60度 到 +60度。
>     *   **Distance (距离/变焦)**: 0.5x 到 2.0x。
> 4.  **AI 生成集成**：
>     *   集成 `@google/genai` SDK。
>     *   使用模型：`gemini-3-pro-image-preview`。
>     *   **Prompt 逻辑**：将相机的数值参数转化为自然语言描述（例如："high-angle overhead shot", "right side profile view"），结合原图发送给模型进行重绘。
> 5.  **UI/UX 风格**：深色模式 (Dark Mode)，赛博朋克/科技感配色（Neon Blue/Pink），响应式布局。
>
> **技术栈**：React 19, Tailwind CSS, Google GenAI SDK.

---

## ✨ 功能特性

*   **交互式 3D 视图**：直观地看到相机在 3D 空间中相对于物体的位置。
*   **多维度控制**：支持鼠标直接拖拽 3D 场景，或使用滑块微调。
*   **智能参数转换**：自动将数学角度转换为 Gemini 能理解的摄影术语 Prompt。
*   **实时反馈**：拖拽时的动态高亮和数据变化。
*   **自适应布局**：左侧控制，右侧实时预览生成结果。

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI SDK**: Google GenAI SDK (`@google/genai`)
*   **Model**: Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

本项目设计为在 Google AI Studio 环境中直接运行（通过 `window.aistudio` 获取 Key）。
如果是本地运行，请确保设置环境变量：

```bash
# .env
API_KEY=your_gemini_api_key_here
```

### 3. 运行开发服务器

```bash
npm run dev
```

## 📝 注意事项

*   **模型选择**：本项目强制使用 `gemini-3-pro-image-preview` 以获得最佳的图像一致性和指令遵循能力。
*   **3D 投影逻辑**：`CameraVisualizer` 组件使用了一个简单的 3D 到 2D 的透视投影算法，无需引入 Three.js 等重型库，保持了项目的轻量化。
*   **权限**：由于使用了高级图像生成模型，用户必须连接付费项目的 API Key。

## 📄 License

MIT
