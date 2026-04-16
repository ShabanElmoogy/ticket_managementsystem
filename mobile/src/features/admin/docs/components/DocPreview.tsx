import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { DocBlock } from '../types/types';
import {
  PreviewHeading, PreviewText, PreviewDivider, PreviewImage, PreviewVideo,
  PreviewBulletedList, PreviewNumberedList, PreviewCode, PreviewQuote,
  PreviewCallout, PreviewTable, PreviewToggle, PreviewTabs,
  PreviewVideoCarousel, getPreviewColors,
} from './preview';

interface Props { blocks: DocBlock[]; isDark: boolean; }

const DocPreview: React.FC<Props> = ({ blocks, isDark }) => {
  const [openToggles,  setOpenToggles]  = useState<Record<string, boolean>>({});
  const [activeTabs,   setActiveTabs]   = useState<Record<string, number>>({});
  const [carouselIdx,  setCarouselIdx]  = useState<Record<string, number>>({});

  const colors = getPreviewColors(isDark);

  const renderBlock = (block: DocBlock) => {
    switch (block.type) {
      case 'heading':
        return <PreviewHeading key={block.id} block={block as any} colors={colors} />;
      case 'text':
        return <PreviewText key={block.id} block={block as any} colors={colors} />;
      case 'divider':
        return <PreviewDivider key={block.id} block={block as any} colors={colors} />;
      case 'image':
        return <PreviewImage key={block.id} block={block as any} isDark={isDark} colors={colors} />;
      case 'video':
        return <PreviewVideo key={block.id} block={block as any} isDark={isDark} colors={colors} />;
      case 'bulletedList':
        return <PreviewBulletedList key={block.id} block={block as any} colors={colors} />;
      case 'numberedList':
        return <PreviewNumberedList key={block.id} block={block as any} colors={colors} />;
      case 'code':
        return <PreviewCode key={block.id} block={block as any} isDark={isDark} colors={colors} />;
      case 'quote':
        return <PreviewQuote key={block.id} block={block as any} colors={colors} />;
      case 'callout':
        return <PreviewCallout key={block.id} block={block as any} isDark={isDark} colors={colors} />;
      case 'table':
        return <PreviewTable key={block.id} block={block as any} isDark={isDark} colors={colors} />;
      case 'toggle':
        return (
          <PreviewToggle
            key={block.id}
            block={block as any}
            isDark={isDark}
            colors={colors}
            isOpen={!!openToggles[block.id]}
            onToggle={() => setOpenToggles((s) => ({ ...s, [block.id]: !s[block.id] }))}
          />
        );
      case 'tabs': {
        const activeIdx = activeTabs[block.id] ?? 0;
        return (
          <PreviewTabs
            key={block.id}
            block={block as any}
            colors={colors}
            activeIdx={activeIdx}
            onTabChange={(idx) => setActiveTabs((s) => ({ ...s, [block.id]: idx }))}
          />
        );
      }
      case 'videoCarousel': {
        const idx = carouselIdx[block.id] ?? 0;
        const total = (block as any).videos?.length ?? 0;
        return (
          <PreviewVideoCarousel
            key={block.id}
            block={block as any}
            colors={colors}
            idx={idx}
            onPrev={() => setCarouselIdx((s) => ({ ...s, [block.id]: Math.max(0, idx - 1) }))}
            onNext={() => setCarouselIdx((s) => ({ ...s, [block.id]: Math.min(total - 1, idx + 1) }))}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {blocks.map(renderBlock)}
    </ScrollView>
  );
};

export default DocPreview;
