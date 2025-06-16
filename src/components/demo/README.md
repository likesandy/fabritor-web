# Fabritor Demo - Text & Stickers

This is a simple demonstration of the core functionality of the fabritor canvas editor, featuring both text editing and sticker functionality.

## Features

### 🎨 Canvas Component

- Interactive canvas area powered by fabric.js
- Displays and manipulates text elements
- Drag and drop text positioning
- Visual selection indicators

### ➕ Add Text Button

- Adds new text elements to the top-left corner (50px from edges)
- Default text: "Double-click to edit"
- Automatically applies boundary constraints to new elements

### ⭐ Add Sticker Button

- Adds colorful geometric stickers to the canvas
- **Random sticker types**: Circles, stars, hearts, and rounded squares
- **Vibrant colors**: Each sticker type has its own color scheme (red circles, yellow stars, pink hearts, green squares)
- **Smart positioning**: Stickers are placed at (150, 150) to avoid overlap with text
- **Boundary constraints**: All stickers respect canvas boundaries and stay accessible

### ✏️ Text Editing

- **Double-click** any text element to edit content directly
- **Single-click** to select and move text elements
- Real-time text content updates

### 🎛️ Text Properties Panel

- **Text Content**: Edit text content via textarea input
- **Font Size**: Adjustable from 12px to 200px with slider
- **Text Color**: Full color picker with gradient support
- **Text Alignment**: Left, center, right alignment options

### 🧹 Clear Canvas

- Remove all text and sticker elements with one click
- Preserves the canvas background
- Resets the canvas to a clean state

## Usage

1. **Access the demo**: Navigate to `/test` in your browser
2. **Add content**:
   - Click "Add Text" to create a new text element
   - Click "Add Sticker" to add a random colorful sticker (circle, star, heart, or square)
3. **Edit content**: Double-click on any text to edit it directly, or use the properties panel
4. **Customize text**: Select a text element and use the properties panel to adjust:
   - Font size with the slider
   - Text color with the color picker
   - Text alignment (left, center, right, justify) with visual icon buttons
   - Object positioning within the canvas using positioning controls
5. **Move objects**: Drag any text or sticker to reposition it (boundary constraints keep them accessible)
6. **Clear canvas**: Use the "Clear Canvas" button to remove all content and start fresh

## Technical Implementation

- **Framework**: React with TypeScript
- **Canvas Engine**: fabric.js via fabritor's Editor class
- **UI Components**: Ant Design
- **State Management**: React Context (GlobalStateContext)
- **Styling**: SCSS modules

## File Structure

```
src/components/demo/
├── DemoCanvas.tsx          # Main demo component
├── TextPropertiesPanel.tsx # Text properties controls
├── demo.scss              # Demo-specific styles
└── README.md              # This documentation
```

## Integration with Fabritor

This demo reuses core fabritor components:

- `Editor` class for canvas management
- `createTextbox` function for text creation
- `AlignSetter`, `ColorSetter`, `SliderInputNumber` UI components
- `GlobalStateContext` for state management
- Utility functions for color transformations

The demo provides a simplified, focused interface while maintaining full compatibility with the fabritor ecosystem.
