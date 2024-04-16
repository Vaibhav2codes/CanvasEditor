import React, { useRef, useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import './styles.css'

const CanvasEditor = ({ templateData }) => {
  const canvasRef = useRef(null);
  const [caption, setCaption] = useState(templateData.caption.text);
  const [callToAction, setCallToAction] = useState(templateData.cta.text);
  const [backgroundColor, setBackgroundColor] = useState('#0369A1'); // Default background color

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load design pattern
    const designPattern = new Image();
    designPattern.src = addRandomQueryParam(templateData.urls.design_pattern);
    designPattern.onload = () => {
      ctx.drawImage(designPattern, 0, 0, canvas.width, canvas.height);

      // Apply mask
      const mask = new Image();
      mask.src = addRandomQueryParam(templateData.urls.mask);
      mask.onload = () => {
        ctx.drawImage(mask, templateData.image_mask.x, templateData.image_mask.y, templateData.image_mask.width, templateData.image_mask.height);

        // Apply mask stroke
        const maskStroke = new Image();
        maskStroke.src = addRandomQueryParam(templateData.urls.stroke);
        maskStroke.onload = () => {
          ctx.drawImage(maskStroke, templateData.image_mask.x+1, templateData.image_mask.y+1, templateData.image_mask.width, templateData.image_mask.height);

          // Draw caption
          drawText(ctx, caption, templateData.caption);

          // Draw call to action
          drawCTA(ctx, callToAction, templateData.cta);
        };
      };
    };
  }, []);

  const handleCaptionChange = (event) => {
    setCaption(event.target.value);
  };

  const handleCallToActionChange = (event) => {
    setCallToAction(event.target.value);
  };

  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color.hex);
  };

  const addRandomQueryParam = (url) => {
    const randomQueryParam = Math.floor(Math.random() * 100000); // Generate a random number
    return `${url}?random=${randomQueryParam}`;
  };

  const drawText = (ctx, text, data) => {
    ctx.fillStyle = data.text_color;
    ctx.font = `${data.font_size}px Arial`;
    ctx.textAlign = data.alignment;
  
    const lines = breakTextIntoLines(ctx, text, data.max_characters_per_line);
    let offsetY = data.position.y;
    lines.forEach((line) => {
      // Ensure text is drawn within canvas boundaries
      if (offsetY + data.font_size <= canvasRef.current.height) {
        ctx.fillText(line, data.position.x, offsetY);
      }
      offsetY += data.font_size + 5; // Adjust for line spacing
    });
  };

  const drawCTA = (ctx, text, data) => {
    ctx.fillStyle = data.text_color;
    ctx.font = `${data.font_size || 30}px Arial`;
    const ctaWidth = ctx.measureText(text).width + 48;
    const ctaHeight = data.font_size + 24;
    const ctaX = data.position.x;
    const ctaY = data.position.y;
    const cornerRadius = 10;
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(ctaX + cornerRadius, ctaY);
    ctx.arcTo(ctaX + ctaWidth, ctaY, ctaX + ctaWidth, ctaY + ctaHeight, cornerRadius);
    ctx.arcTo(ctaX + ctaWidth, ctaY + ctaHeight, ctaX, ctaY + ctaHeight, cornerRadius);
    ctx.arcTo(ctaX, ctaY + ctaHeight, ctaX, ctaY, cornerRadius);
    ctx.arcTo(ctaX, ctaY, ctaX + ctaWidth, ctaY, cornerRadius);
    ctx.closePath();
    
    ctx.fillStyle = data.background_color;
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = data.text_color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2);
  };

  const breakTextIntoLines = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const width = ctx.measureText(`${currentLine} ${word}`).width;
      if (width < maxWidth || currentLine === '') {
        currentLine += (currentLine === '' ? '' : ' ') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    lines.push(currentLine); // Push the last line
    return lines;
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={1080}
        height={1080}
        className="border border-gray-400"
        style={{ width: '400px', height: '400px' }}
      />
      <div className="mt-4 flex flex-col items-center">
        <input
          type="text"
          value={caption}
          onChange={handleCaptionChange}
          placeholder="Enter Caption"
          className="border border-gray-400 p-2 mb-2"
        />
        <input
          type="text"
          value={callToAction}
          onChange={handleCallToActionChange}
          placeholder="Enter CTA Text"
          className="border border-gray-400 p-2 mb-2"
        />
        <div className="color-picker">
          <ChromePicker color={backgroundColor} onChangeComplete={handleBackgroundColorChange} />
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
