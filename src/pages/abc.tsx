import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import styles from './abc.module.css';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// 定义单个项目的类型接口
interface Item {
  id: string | number;
  duration: string;
}

// 定义图片网格组件的 props 类型接口
interface ImageGridProps {
  items: Item[];
  title?: string;
  dragHandle?: React.ReactNode;
}

// 图片网格组件
const ImageGrid: React.FC<ImageGridProps> = ({ items, title, dragHandle }) => {
  // 状态：列表是否已展开
  const [isExpanded, setIsExpanded] = useState(false);
  // 状态：动态计算出的两行最多能显示的项目数量
  const [maxItemsInTwoRows, setMaxItemsInTwoRows] = useState(7); // 默认值，稍后会动态更新
  // Ref：用于获取网格容器的 DOM 元素
  const gridRef = useRef<HTMLDivElement>(null);

  // 使用 useCallback 封装计算逻辑，避免不必要的重新创建
  const calculateAndUpdateMaxItems = useCallback(() => {
    if (gridRef.current) {
      const gridWidth = gridRef.current.offsetWidth; // 获取网格容器的当前宽度
      const itemMinWidth = 150; // 单个项目的最小宽度，对应CSS中的 minmax(150px, 1fr)
      const gap = 16; // 项目之间的间距，对应CSS中的 gap: 16px

      // 计算当前网格宽度能容纳多少列
      const columns = Math.floor((gridWidth + gap) / (itemMinWidth + gap));

      // 两行可以容纳 (2 * 列数) 个网格项。其中一个是"+"号按钮，所以减1。
      const capacity = (2 * columns) - 1;
      
      // 确保我们得到的容量至少为1
      setMaxItemsInTwoRows(Math.max(1, capacity));
    }
  }, []);

  // 使用 useLayoutEffect 在 DOM 渲染后、浏览器绘制前执行，以避免闪烁
  useLayoutEffect(() => {
    // 组件加载时先计算一次
    calculateAndUpdateMaxItems();
    // 监听窗口大小变化，动态重新计算
    window.addEventListener('resize', calculateAndUpdateMaxItems);
    // 组件卸载时，清除监听器，防止内存泄漏
    return () => window.removeEventListener('resize', calculateAndUpdateMaxItems);
  }, [calculateAndUpdateMaxItems]);

  // 判断是否需要显示"展开更多"按钮
  const showExpandButton = items.length > maxItemsInTwoRows;
  // 根据是否显示按钮和展开状态，决定最终要渲染的项目列表
  const itemsToShow = !showExpandButton || isExpanded ? items : items.slice(0, maxItemsInTwoRows);

  // 点击按钮时，切换展开/收起状态
  const toggleItems = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        {dragHandle}
        {title && <h2 className={styles.title}>{title}</h2>}
      </div>
      <div
        ref={gridRef}
        className={styles.grid}
      >
        <div className={styles.addButton}>
          +
        </div>
        {itemsToShow.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.duration}>
              {item.duration}
            </div>
          </div>
        ))}
      </div>
      {showExpandButton && (
        <div className={styles.expandButtonContainer}>
          <button onClick={toggleItems} className={styles.expandButton}>
            {isExpanded ? '收起更多' : '展开更多'}
            <svg
              className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// 新的、可排序的 ImageGrid 包装器组件
const SortableImageGrid = ({ id, title, items }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: `translateY(${transform?.y || 0}px)`,
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  // 创建拖拽手柄，并将 listeners 绑定到这里
  const handle = (
    <button {...listeners} className={styles.dragHandle}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ImageGrid title={title} items={items} dragHandle={handle} />
    </div>
  );
};

// 模拟数据1: 新闻片段
const newsItems = Array.from({ length: 6 }, (_, i) => ({
  id: `news-${i}`,
  duration: `00:${String(Math.floor(Math.random() * 50) + 10).padStart(2, '0')}`,
}));

// 模拟数据2: 动漫剪辑
const animeItems = Array.from({ length: 15 }, (_, i) => ({
  id: `anime-${i}`,
  duration: `00:${String(Math.floor(Math.random() * 50) + 10).padStart(2, '0')}`,
}));

// 主页面组件
export default function AbcPage() {
  const [gridSections, setGridSections] = useState([
    { id: 'news', title: '新闻片段', items: newsItems },
    { id: 'anime', title: '动漫剪辑', items: animeItems },
  ]);
  
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGridSections((sections) => {
        const oldIndex = sections.findIndex((section) => section.id === active.id);
        const newIndex = sections.findIndex((section) => section.id === over.id);
        return arrayMove(sections, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={gridSections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {gridSections.map(({ id, title, items }) => (
            <SortableImageGrid key={id} id={id} title={title} items={items} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
