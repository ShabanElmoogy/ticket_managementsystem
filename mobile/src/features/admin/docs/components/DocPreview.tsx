import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { DocBlock } from '@/src/features/admin/docs/types/types';
import {
  PreviewHeading, PreviewText, PreviewDivider, PreviewImage, PreviewVideo,
  PreviewBulletedList, PreviewNumberedList, PreviewCode, PreviewQuote,
  PreviewCallout, PreviewTable, PreviewToggle, PreviewTabs,
  PreviewVideoCarousel, PreviewImageCarousel, PreviewPdf, PreviewExcel,
} from '@/src/features/admin/docs/components/preview';
import { usePreviewColors } from '@/src/features/admin/docs/components/preview/previewUtils';

interface Props { blocks: DocBlock[]; }

const DocPreview: React.FC<Props> = ({ blocks }) => {
  const [openToggles, setOpenToggles] = useState<Record<string, boolean>>({});
  const [activeTabs,  setActiveTabs]  = useState<Record<string, number>>({});
  const colors = usePreviewColors();

  const renderBlock = (block: DocBlock) => {
    switch (block.type) {
      case 'heading':
        return <PreviewHeading key={block.id} block={block as any} colors={colors} />;
      case 'text':
        return <PreviewText key={block.id} block={block as any} colors={colors} />;
      case 'divider':
        return <PreviewDivider key={block.id} block={block as any} colors={colors} />;
      case 'image':
        return <PreviewImage key={block.id} block={block as any} colors={colors} />;
      case 'video':
        return <PreviewVideo key={block.id} block={block as any} colors={colors} />;
      case 'bulletedList':
        return <PreviewBulletedList key={block.id} block={block as any} colors={colors} />;
      case 'numberedList':
        return <PreviewNumberedList key={block.id} block={block as any} colors={colors} />;
      case 'code':
        return <PreviewCode key={block.id} block={block as any} colors={colors} />;
      case 'quote':
        return <PreviewQuote key={block.id} block={block as any} colors={colors} />;
      case 'callout':
        return <PreviewCallout key={block.id} block={block as any} colors={colors} />;
      case 'table':
        return <PreviewTable key={block.id} block={block as any} colors={colors} />;
      case 'toggle':
        return (
          <PreviewToggle
            key={block.id}
            block={block as any}
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
      case 'videoCarousel':
        return <PreviewVideoCarousel key={block.id} block={block as any} colors={colors} />;
      case 'imageCarousel':
        return <PreviewImageCarousel key={block.id} block={block as any} colors={colors} />;
      case 'pdf':
        return <PreviewPdf key={block.id} block={block as any} colors={colors} />;
      case 'excel':
        return <PreviewExcel key={block.id} block={block as any} colors={colors} />;
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
