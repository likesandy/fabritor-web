import { Button, message, Space, Typography } from 'antd';
import type { ClipboardEvent, KeyboardEvent, MouseEvent } from 'react';
import { createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import './test.css';

const { Title } = Typography;

interface EditorData {
  id: string;
  title: string;
  placeholder: string;
  defaultText?: string;
}

// 定义输出的数据结构
interface OutputData {
  SpeechTextArray: string[];
}

// 1. 创建 Context
const EditorContext = createContext<{ exportData: () => void } | null>(null);

// 2. 创建新的 ExportButton 组件
const ExportButton = () => {
  const editorContext = useContext(EditorContext);

  const handleExport = () => {
    if (editorContext) {
      editorContext.exportData();
    } else {
      message.error('导出功能不可用');
    }
  };

  return (
    <Button
      type="primary"
      onClick={handleExport}
      onMouseDown={(e) => e.preventDefault()} // 防止编辑器失去焦点
      title="导出所有编辑器内容为JSON格式"
    >
      📤 导出数据
    </Button>
  );
};

// 编辑器配置
const editors: EditorData[] = [
  {
    id: 'editor1',
    title: '📝 文本编辑器 1',
    placeholder: '这是第一个支持停顿标记的编辑器...',
    defaultText: '欢迎使用音频编辑器。在这里，你可以输入文本，并插入停顿。例如，我们在这里插入一个1秒的停顿 <span class="pause-marker-element" contenteditable="false" data-pause-id="pause_default_1" data-duration="1"><span class="pause-marker-content"><span class="pause-icon">⏸️</span><span class="pause-text">停顿 1s</span></span></span> 然后继续我们的文本。',
  },
  {
    id: 'editor2',
    title: '📝 文本编辑器 2',
    placeholder: '这是第二个支持停顿标记的编辑器...',
  },
  {
    id: 'editor3',
    title: '📝 文本编辑器 3',
    placeholder: '这是第三个支持停顿标记的编辑器...',
  },
];

// 3. 将 Test 组件重构为 EditorArea
const EditorArea = forwardRef((props, ref) => {
  const [currentFocusedEditor, setCurrentFocusedEditor] = useState<string | null>(null);
  const editorsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    editors.forEach(editorConfig => {
      const editorElement = editorsRef.current[editorConfig.id];
      if (editorElement && editorConfig.defaultText && !editorElement.innerHTML) {
        editorElement.innerHTML = editorConfig.defaultText;
      }
    });
  }, []);

  // 在当前聚焦的编辑器中插入停顿标记
  const insertPauseMarker = useCallback((editorId: string) => {
    const editor = editorsRef.current[editorId];
    if (!editor) return;

    // 确保编辑器有焦点
    editor.focus();

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) {
        message.warning('请先将光标放在编辑器中的目标位置');
        return;
      }

      // 检查光标是否在当前编辑器内
      let range: Range;
      if (selection.rangeCount === 0) {
        // 如果没有选区，在编辑器末尾创建一个
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        range = selection.getRangeAt(0);

        // 检查当前选区是否在编辑器内
        const isInsideEditor = editor.contains(range.commonAncestorContainer) ||
                              editor.contains(range.startContainer) ||
                              editor.contains(range.endContainer);

        if (!isInsideEditor) {
          message.warning('请先将光标放在编辑器中的目标位置');
          return;
        }
      }

      const pauseId = `pause_${Date.now()}`;

      // 创建停顿标记元素
      const pauseElement = document.createElement('span');
      pauseElement.className = 'pause-marker-element';
      pauseElement.contentEditable = 'false';
      pauseElement.setAttribute('data-pause-id', pauseId);
      pauseElement.setAttribute('data-duration', '1');
      pauseElement.innerHTML = `
        <span class="pause-marker-content">
          <span class="pause-icon">⏸️</span>
          <span class="pause-text">停顿 1s</span>
        </span>
      `;

      // 插入停顿标记
      range.deleteContents();
      range.insertNode(pauseElement);

      // 在停顿标记后添加空格并移动光标
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(pauseElement);
      range.insertNode(spaceNode);
      range.setStartAfter(spaceNode);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    }, 50);
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent, editorId: string) => {
    const editor = editorsRef.current[editorId];
    if (!editor) return;

    event.preventDefault();

    const pastedText = event.clipboardData.getData('text/plain');
    const currentText = editor.textContent || '';
    const remainingLength =1000 - currentText.length;

    if (remainingLength <= 0) {
      message.warning('已达到最大字数限制，无法粘贴。');
      return;
    }

    const textToInsert = pastedText.substring(0, remainingLength);

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(textToInsert);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    if (pastedText.length > remainingLength) {
      message.warning('内容已自动截断以符合1000字符的限制。');
    }
  }, []);

  // 处理编辑器聚焦
  const handleEditorFocus = useCallback((editorId: string) => {
    setCurrentFocusedEditor(editorId);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent, editorId: string) => {
    const editor = editorsRef.current[editorId];
    if (!editor) return;

    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Tab'
    ];
    const isModifier = event.ctrlKey || event.metaKey || event.altKey;

    if (editor.textContent && editor.textContent.length >= 1000 && !allowedKeys.includes(event.key) && !isModifier) {
      event.preventDefault();
      message.warning('每个编辑器最多输入1000个字符。');
      return;
    }

    // 处理删除键，确保停顿标记整体删除
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);

      if (event.key === 'Backspace') {
        let nodeToCheck = range.startContainer;
        let offsetToCheck = range.startOffset;

        if (nodeToCheck.nodeType === Node.TEXT_NODE && offsetToCheck > 0) return;

        if (nodeToCheck.nodeType === Node.TEXT_NODE && offsetToCheck === 0) {
          nodeToCheck = nodeToCheck.previousSibling;
        } else if (nodeToCheck.nodeType === Node.ELEMENT_NODE && offsetToCheck > 0) {
          nodeToCheck = nodeToCheck.childNodes[offsetToCheck - 1];
        }

        if (nodeToCheck && nodeToCheck.nodeType === Node.ELEMENT_NODE && (nodeToCheck as Element).classList.contains('pause-marker-element')) {
          event.preventDefault();
          (nodeToCheck as Element).remove();
        }
      }

      if (event.key === 'Delete') {
        let nodeToCheck = range.startContainer;
        let offsetToCheck = range.startOffset;

        if (nodeToCheck.nodeType === Node.TEXT_NODE && offsetToCheck < (nodeToCheck.textContent?.length || 0)) return;

        if (nodeToCheck.nodeType === Node.TEXT_NODE) {
          nodeToCheck = nodeToCheck.nextSibling;
        } else if (nodeToCheck.nodeType === Node.ELEMENT_NODE) {
          nodeToCheck = nodeToCheck.childNodes[offsetToCheck];
        }

        if (nodeToCheck && nodeToCheck.nodeType === Node.ELEMENT_NODE && (nodeToCheck as Element).classList.contains('pause-marker-element')) {
          event.preventDefault();
          (nodeToCheck as Element).remove();
        }
      }
    }
  }, [insertPauseMarker]);

  // 处理按钮鼠标按下事件，防止输入框失去焦点
  const handleButtonMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  // 获取编辑器样式
  const getEditorStyle = useCallback(() => {
    return {
      minHeight: '150px',
      border: '2px solid #d9d9d9',
      borderRadius: '8px',
      padding: '16px',
      background: 'white',
      fontSize: '14px',
      lineHeight: '1.6',
      outline: 'none',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease',
      width: '100%',
      boxSizing: 'border-box' as const,
    };
  }, []);

  // 处理导出数据
  const handleExportData = useCallback(() => {
    const result: OutputData = { SpeechTextArray: [] };
    
    // 遍历所有编辑器
    editors.forEach(editor => {
      const editorElement = editorsRef.current[editor.id];
      if (editorElement && editorElement.textContent?.trim()) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorElement.innerHTML;
        
        // 替换所有停顿标记为<break>标签
        tempDiv.querySelectorAll('.pause-marker-element').forEach(pauseElement => {
          const duration = pauseElement.getAttribute('data-duration') || '1';
          const breakTag = `<break time="${duration}s"/>`;
          if (pauseElement.parentNode) {
            pauseElement.parentNode.replaceChild(document.createTextNode(breakTag), pauseElement);
          }
        });
        
        result.SpeechTextArray.push(tempDiv.textContent || '');
      }
    });
    
    message.success('数据已导出到控制台');
    console.log('导出的数据结构:', JSON.stringify(result, null, 2));
  }, []);

  useImperativeHandle(ref, () => ({
    exportData() {
      handleExportData();
    }
  }));

  return (
    <>
      {/* 多个富文本编辑器 */}
      {editors.map((editorData) => (
        <div key={editorData.id} className="audio-editor-content" style={{ marginBottom: '20px' }}>
          <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Title level={5} style={{ margin: 0 }}>
              {editorData.title}
            </Title>
            <Button
              onClick={() => insertPauseMarker(editorData.id)}
              onMouseDown={handleButtonMouseDown}
              title="在此编辑器中插入停顿标记"
              disabled={currentFocusedEditor !== editorData.id}
            >
              ⏸️ 插入停顿
            </Button>
          </div>
          <div className="text-input-area">
            <div
              ref={(el) => { editorsRef.current[editorData.id] = el; }}
              contentEditable
              className="rich-text-editor"
              onKeyDown={(e) => handleKeyDown(e, editorData.id)}
              onPaste={(e) => handlePaste(e, editorData.id)}
              onFocus={() => handleEditorFocus(editorData.id)}
              data-placeholder={editorData.placeholder}
              suppressContentEditableWarning
              style={getEditorStyle()}
            />
          </div>
        </div>
      ))}
    </>
  );
});

// 4. 创建新的顶层组件
export default function Test() {
  const editorAreaRef = useRef<{ exportData: () => void }>(null);

  const contextValue = {
    exportData: () => {
      editorAreaRef.current?.exportData();
    },
  };

  return (
    <EditorContext.Provider value={contextValue}>
      <div className="audio-editor">
        {/* 操作按钮 */}
        <div className="audio-editor-header">
          <Space>
            <ExportButton />
          </Space>
        </div>

        <EditorArea ref={editorAreaRef} />
      </div>
    </EditorContext.Provider>
  );
}


