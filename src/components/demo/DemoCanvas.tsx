import { fabric } from 'fabric'
import { useEffect, useRef, useState } from 'react'
import { Layout, Button, Card, Space, Typography, Spin, Radio } from 'antd'
import { StarOutlined } from '@ant-design/icons'
import Editor from '@/editor'
import { GlobalStateContext } from '@/context'
import { createTextbox } from '@/editor/objects/textbox'
import createShape from '@/editor/objects/shape'
import { uuid } from '@/utils'
import TextPropertiesPanel from './TextPropertiesPanel'
import './demo.scss'

const { Content, Sider } = Layout
const { Title } = Typography

const demoStyle: React.CSSProperties = {
  height: '100vh',
  background: '#f5f5f5'
}

const canvasContainerStyle: React.CSSProperties = {
  background: '#ddd',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}

const headerStyle: React.CSSProperties = {
  background: '#fff',
  padding: '16px 24px',
  borderBottom: '1px solid #e8e8e8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const siderStyle: React.CSSProperties = {
  background: '#fff',
  borderLeft: '1px solid #e8e8e8',
  padding: '16px'
}

// Constraint function to keep elements within canvas bounds
// Implements soft boundaries - allows partial movement but keeps 20px visible
const constrainObjectToCanvas = (obj: any, canvas: fabric.Canvas) => {
  const VISIBLE_MARGIN = 20 // Minimum pixels that must remain visible

  // Get object dimensions
  const objWidth = obj.getScaledWidth()
  const objHeight = obj.getScaledHeight()

  // Get canvas dimensions (excluding the sketch background)
  const canvasWidth = canvas.width || 800
  const canvasHeight = canvas.height || 600

  // Calculate boundaries with visible margin
  const minLeft = -(objWidth - VISIBLE_MARGIN)
  const maxLeft = canvasWidth - VISIBLE_MARGIN
  const minTop = -(objHeight - VISIBLE_MARGIN)
  const maxTop = canvasHeight - VISIBLE_MARGIN

  // Apply constraints
  if (obj.left < minLeft) obj.left = minLeft
  if (obj.left > maxLeft) obj.left = maxLeft
  if (obj.top < minTop) obj.top = minTop
  if (obj.top > maxTop) obj.top = maxTop

  // Update object position
  obj.setCoords()
}

export default function DemoCanvas() {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const workspaceEl = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [activeObject, setActiveObject] = useState<
    fabric.Object | null | undefined
  >(null)
  const [isReady, setReady] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('4:3')

  const selectionHandler = (e: any) => {
    const activeObject = e.selected?.[0] || e.target
    setActiveObject(activeObject)
  }

  const initEvent = () => {
    if (!editor) return

    editor.canvas.on('selection:created', selectionHandler)
    editor.canvas.on('selection:updated', selectionHandler)
    editor.canvas.on('selection:cleared', () => setActiveObject(null))

    // Enable text editing on double click
    editor.canvas.on('mouse:dblclick', (e: any) => {
      const target = e.target
      if (target && target.type === 'f-text') {
        // Type assertion for fabric text object
        const textObj = target as any
        textObj.enterEditing()
        textObj.selectAll()
      }
    })

    // Add boundary constraints for all draggable elements (text and stickers)
    editor.canvas.on('object:moving', (e: any) => {
      const obj = e.target
      if (obj && (obj.type === 'f-text' || obj.type === 'circle' || obj.type === 'polygon' || obj.type === 'rect')) {
        constrainObjectToCanvas(obj, editor.canvas)
      }
    })
  }

  const initEditor = async () => {
    if (!canvasEl.current || !workspaceEl.current) return

    const _editor = new Editor({
      canvasEl: canvasEl.current,
      workspaceEl: workspaceEl.current,
      template: { width: 800, height: 600 } // Smaller canvas for demo
    })

    await _editor.init()

    setEditor(_editor)
    setReady(true)
    setActiveObject(_editor.sketch)
  }

  const handleAddText = async () => {
    if (!editor) return

    // Position text at top-left corner with 50px margin from edges
    await createTextbox({
      text: 'Double-click to edit',
      canvas: editor.canvas,
      left: 50,
      top: 50,
      fontSize: 32,
      fill: '#000000',
      textAlign: 'left'
    })
  }

  const handleAddVerticalText = async () => {
    if (!editor) return;

    await createTextbox({
      text: 'Vertical Text',
      canvas: editor.canvas,
      lockMovementX: true,
      fontSize: 32,
      fill: '#000000',
      textAlign: 'center'
    });
  };

  const handleAddSticker = () => {
    if (!editor) return

    // Array of sticker types to cycle through
    const stickerTypes = [
      // Circle sticker
      () => {
        const circle = new fabric.Circle({
          radius: 40,
          fill: '#FF6B6B',
          stroke: '#FF5252',
          strokeWidth: 3
        })
        ;(circle as any).id = uuid()
        return circle
      },
      // Star sticker
      () => {
        const starPoints = []
        const outerRadius = 50
        const innerRadius = 25
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          starPoints.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        const star = new fabric.Polygon(starPoints, {
          fill: '#FFD93D',
          stroke: '#FFC107',
          strokeWidth: 3
        })
        ;(star as any).id = uuid()
        return star
      },
      // Heart sticker (simplified heart shape using polygon)
      () => {
        const heart = new fabric.Polygon([
          { x: 0, y: 15 },
          { x: -25, y: -10 },
          { x: -15, y: -25 },
          { x: 0, y: -15 },
          { x: 15, y: -25 },
          { x: 25, y: -10 }
        ], {
          fill: '#E91E63',
          stroke: '#C2185B',
          strokeWidth: 3
        })
        ;(heart as any).id = uuid()
        return heart
      },
      // Square sticker
      () => {
        const rect = new fabric.Rect({
          width: 80,
          height: 80,
          fill: '#4CAF50',
          stroke: '#388E3C',
          strokeWidth: 3,
          rx: 10,
          ry: 10
        })
        ;(rect as any).id = uuid()
        return rect
      }
    ]

    // Get a random sticker type
    const randomIndex = Math.floor(Math.random() * stickerTypes.length)
    const sticker = stickerTypes[randomIndex]()

    // Position sticker at a default location
    ;(sticker as any).set({
      left: 150,
      top: 150
    })

    // Add to canvas
    editor.canvas.add(sticker)
    editor.canvas.setActiveObject(sticker)
    editor.canvas.requestRenderAll()

    // Apply boundary constraints
    constrainObjectToCanvas(sticker, editor.canvas)
  }

  useEffect(() => {
    if (editor) {
      initEvent()
    }
  }, [editor])

  useEffect(() => {
    initEditor()

    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [])

  const isTextSelected = activeObject && activeObject.type === 'f-text'

  return (
    <GlobalStateContext.Provider
      value={{
        object: activeObject,
        setActiveObject,
        isReady,
        setReady,
        editor,
        roughSvg: null
      }}
    >
      <Layout
        style={demoStyle}
        className="demo-layout"
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <Title
              level={3}
              style={{ margin: 0 }}
            >
              Fabritor Demo - Text & Stickers
            </Title>
            <Typography.Text type="secondary">
              A simple demonstration of fabritor's text and sticker functionality
            </Typography.Text>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleAddText}
              disabled={!isReady}
            >
              Add Text
            </Button>
            <Button
              type="default"
              size="large"
              onClick={handleAddVerticalText}
              disabled={!isReady}
            >
              Add Vertical Text
            </Button>
            <Button
              type="default"
              size="large"
              icon={<StarOutlined />}
              onClick={handleAddSticker}
              disabled={!isReady}
            >
              Add Sticker
            </Button>
            <Button
              size="large"
              onClick={() => {
                if (editor) {
                  // Clear all objects except the sketch
                  const objects = editor.canvas
                    .getObjects()
                    .filter(obj => (obj as any).id !== 'fabritor-sketch')
                  objects.forEach(obj => editor.canvas.remove(obj))
                  editor.canvas.discardActiveObject()
                  editor.canvas.requestRenderAll()
                  setActiveObject(null)
                }
              }}
              disabled={!isReady}
            >
              Clear Canvas
            </Button>
            <Radio.Group
              value={aspectRatio}
              onChange={(e) => {
                const newRatio = e.target.value
                setAspectRatio(newRatio)
                if (editor) {
                  let width, height
                  switch (newRatio) {
                    case '9:16':
                      width = 600
                      height = (600 * 16) / 9
                      break
                    case '16:9':
                      width = (600 * 16) / 9
                      height = 600
                      break
                    case '1:1':
                      width = 600
                      height = 600
                      break
                    case '4:3':
                    default:
                      width = 800
                      height = 600
                      break
                  }
                  editor.setSketchSize({ width, height })
                }
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="9:16">9:16</Radio.Button>
              <Radio.Button value="16:9">16:9</Radio.Button>
              <Radio.Button value="1:1">1:1</Radio.Button>
              <Radio.Button value="4:3">4:3</Radio.Button>
            </Radio.Group>
          </Space>
        </div>

        <Layout style={{ flex: 1 }}>
          {/* Canvas Area */}
          <Content>
            <div
              style={canvasContainerStyle}
              ref={workspaceEl}
              className="demo-workspace"
            >
              <Spin
                spinning={!isReady}
                size="large"
              >
                <canvas ref={canvasEl} />
              </Spin>
            </div>
          </Content>

          {/* Properties Panel */}
          <Sider
            width={300}
            style={siderStyle}
          >
            <Card
              title={isTextSelected ? "Text Properties" : "Add Content"}
              size="small"
              style={{ height: '100%' }}
            >
              {isTextSelected ? (
                <TextPropertiesPanel />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '20px 0'
                  }}
                >
                  Select a text element to edit its properties, or use the buttons above to add content
                </div>
              )}
            </Card>
          </Sider>
        </Layout>
      </Layout>
    </GlobalStateContext.Provider>
  )
}
