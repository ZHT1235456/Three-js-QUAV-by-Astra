# 中文建模文档

- `modeling-phase-2.tex`：中文 LaTeX 源文件。
- `modeling-phase-2.pdf`：编译后的文档。
- `figures/front.png`：实际页面的正面模型截图。

标题：《基于Three.js的四旋翼无人机建模(第二期)》  
作者：朱华天、GPT-6 Astra  
日期：2026年9月9日

在本目录运行（需要支持中文的 TeX Live / XeLaTeX）：

```sh
xelatex -interaction=nonstopmode -halt-on-error modeling-phase-2.tex
xelatex -interaction=nonstopmode -halt-on-error modeling-phase-2.tex
```

文档还引用仓库根目录的效果截图和 `figures/` 中的参考图，请完整克隆仓库后编译。图像模型名称与生成过程按作者提供的实验记录撰写。
