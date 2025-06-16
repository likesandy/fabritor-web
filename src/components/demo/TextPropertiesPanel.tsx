import { useContext, useEffect } from 'react'
import { Form, Space, Typography, Input, Divider } from 'antd'
import { GlobalStateContext } from '@/context'
import AlignSetter from '@/fabritor/UI/setter/TextSetter/AlignSetter'
import ColorSetter from '@/fabritor/UI/setter/ColorSetter'
import SliderInputNumber from '@/fabritor/components/SliderInputNumber'
import { transformColors2Fill, transformFill2Colors } from '@/utils'

const { Item: FormItem } = Form
const { Text } = Typography

export default function TextPropertiesPanel() {
  const { object, editor } = useContext(GlobalStateContext)
  const [form] = Form.useForm()

  const handleFill = fillValue => {
    if (!object || !editor) return

    const fill = transformColors2Fill(fillValue)
    object.set('fill', fill)
    editor.canvas.requestRenderAll()
    editor.fireCustomModifiedEvent()
  }

  const handleValuesChange = async values => {
    if (!object || !editor) return

    const keys = Object.keys(values)
    if (!keys?.length) return

    for (let key of keys) {
      if (key === 'fill') {
        handleFill(values[key])
      } else if (key === 'text') {
        ;(object as any).set('text', values[key])
        ;(object as any).initDimensions()
      } else {
        ;(object as any).set(key, values[key])
      }
    }

    editor.canvas.requestRenderAll()

    // Fire custom modified event for non-slider properties
    if (!keys.includes('fontSize')) {
      editor.fireCustomModifiedEvent()
    }
  }

  const handleFontSizeChangeComplete = () => {
    if (editor) {
      editor.fireCustomModifiedEvent()
    }
  }

  useEffect(() => {
    if (!object) return

    form.setFieldsValue({
      text: (object as any).text,
      fontSize: (object as any).fontSize,
      fill: transformFill2Colors((object as any).fill),
      textAlign: (object as any).textAlign
    })
  }, [object, form])

  if (!object || object.type !== 'f-text') {
    return null
  }

  return (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      layout="vertical"
      size="small"
    >
      <FormItem
        name="text"
        label={<Text strong>Text Content</Text>}
      >
        <Input.TextArea
          rows={2}
          placeholder="Enter text content..."
        />
      </FormItem>

      <Divider style={{ margin: '12px 0' }} />

      <FormItem
        name="fontSize"
        label={<Text strong>Font Size</Text>}
      >
        <SliderInputNumber
          min={12}
          max={200}
          onChangeComplete={handleFontSizeChangeComplete}
        />
      </FormItem>

      <FormItem
        name="fill"
        label={<Text strong>Text Color</Text>}
      >
        <ColorSetter
          type="fontColor"
          defaultColor="#000000"
        />
      </FormItem>

      <FormItem
        name="textAlign"
        label={<Text strong>Text Alignment</Text>}
      >
        <AlignSetter />
      </FormItem>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f9f9f9',
          borderRadius: 4
        }}
      >
        <Text
          type="secondary"
          style={{ fontSize: 12 }}
        >
          💡 Tip: Double-click on text elements in the canvas to edit their
          content directly.
        </Text>
      </div>
    </Form>
  )
}
