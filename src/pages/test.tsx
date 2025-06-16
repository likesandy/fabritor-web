import { definePageConfig } from 'ice';
import DemoCanvas from '@/components/demo/DemoCanvas';

export const pageConfig = definePageConfig(() => ({
  title: 'Fabritor Demo - Text Editor'
}));

export default function TestPage() {
  return <DemoCanvas />;
}
