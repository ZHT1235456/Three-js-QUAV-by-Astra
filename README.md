# 四旋翼无人机 · Three.js

基于 `figures/1.png` 至 `4.png` 的外观比例重建。包含切面机身、程序化碳纤维纹理、四组机臂和双叶旋翼、电机、航灯、滑橇起落架、前视传感器和可俯仰云台相机。

## 运行

```sh
npm install
npm run dev
```

打开终端显示的本地地址。生产构建：`npm run build`；预览构建：`npm run preview`。

## 使用

鼠标拖动旋转、滚轮缩放、右键平移。支持透视/正视/俯视/侧视、旋翼动画、自动环绕、线框、网格、结构分解、云台俯仰和 GLB 导出。导出保留当前分解状态与云台姿态，若需要完整装配模型请先重置。参考图可点击放大。

`src/drone.js` 为独立模型工厂 `createDrone()`，返回 `root`（Three.js Group）、`rotors`、`parts` 和 `cameraPivot`；`src/main.js` 为场景与交互；`src/style.css` 为界面样式。

坐标系：Y 向上，+Z 为机头。所有长度为按参考图估算的相对单位；参考图没有标注尺寸，不保证工程精度。动画只演示旋翼转动，不包含飞行动力学、质量惯量或控制系统仿真。

使用 Three.js 官方 [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) 和 [GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html)。纹理由代码生成，无外部纹理/CDN 依赖。
