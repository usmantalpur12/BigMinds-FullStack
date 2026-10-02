import React from 'react';
import { View } from 'react-native';
import { Svg, Rect, Path } from 'react-native-svg';

// Simple QR code generator using SVG
// This is a basic implementation - for production, consider using a proper QR library
const generateQRCode = (text: string, size: number = 200): string => {
  // This is a simplified QR code pattern generator
  // For production, use a library like react-native-qrcode-svg
  const modules = 25; // QR code modules
  const moduleSize = size / modules;
  let paths: string[] = [];
  
  // Generate a simple pattern based on text hash
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      const shouldFill = (hash + i * 7 + j * 11) % 3 === 0;
      if (shouldFill) {
        paths.push(`M${j * moduleSize},${i * moduleSize} h${moduleSize} v${moduleSize} h-${moduleSize} z`);
      }
    }
  }
  
  return paths.join(' ');
};

type TeacherQRCodeProps = {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export const TeacherQRCode: React.FC<TeacherQRCodeProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}) => {
  const qrPath = generateQRCode(value, size);
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={backgroundColor} />
        <Path d={qrPath} fill={color} />
      </Svg>
    </View>
  );
};

