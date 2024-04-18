import React, { useRef, useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import './styles.css';
import $ from 'jquery';

const CanvasEditor = ({ templateData }) => {
  const canvasRef = useRef(null);
  const [caption, setCaption] = useState(templateData.caption.text);
  const [callToAction, setCallToAction] = useState(templateData.cta.text);
  const [backgroundColor, setBackgroundColor] = useState('#0369A1'); // Default background color
  const [showColorPicker, setShowColorPicker] = useState(false);
  const MAX_PICKED_COLORS = 5;
  const [pickedColors, setPickedColors] = useState(getRandomColors());
  const [maskImage, setMaskImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');

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
    designPattern.src = templateData.urls.design_pattern;
    designPattern.onload = () => {
      ctx.drawImage(designPattern, 0, 0, canvas.width, canvas.height);

      // Apply mask
      if (maskImage) {
        ctx.drawImage(maskImage, templateData.image_mask.x, templateData.image_mask.y, templateData.image_mask.width, templateData.image_mask.height);
      } else {
        const mask = new Image();
        mask.src = addRandomQueryParam(templateData.urls.mask);
        mask.onload = () => {
          ctx.drawImage(mask, templateData.image_mask.x, templateData.image_mask.y, templateData.image_mask.width, templateData.image_mask.height);
        };
      }

      // Apply mask stroke
      ctx.save();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 10;
      ctx.strokeRect(templateData.image_mask.x - 5, templateData.image_mask.y - 5, templateData.image_mask.width + 10, templateData.image_mask.height + 10);
      ctx.restore();

      // Draw caption
      drawText(ctx, caption, templateData.caption);

      // Draw call to action
      drawCTA(ctx, callToAction, templateData.cta);
    };
  }, [backgroundColor, caption, callToAction, maskImage, templateData]);

  useEffect(() => {
    $("form").on("change", ".file-upload-field", function(){ 
      $(this).parent(".file-upload-wrapper").attr("data-text", $(this).val().replace(/.*(\/|\\)/, ''));
    });
  }, []);

  const handleCaptionChange = (event) => {
    setCaption(event.target.value);
  };

  const handleCallToActionChange = (event) => {
    setCallToAction(event.target.value);
  };

  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color.hex);
    let newColors = [color.hex, ...pickedColors];
    if (newColors.length > 5) {
      newColors.pop();
    }
    setPickedColors(newColors);
  };

  const handleColorPickerToggle = () => {
    setShowColorPicker(!showColorPicker);
  };

  const handleMaskImageUpload = (event) => {
    const file = event.target.files[0];
    setFileName(event.target.files[0].name);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          setMaskImage(image);
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const addRandomQueryParam = (url) => {
    const randomQueryParam = Math.floor(Math.random() * 100000);
    return `${url}?random=${randomQueryParam}`;
  };

  const drawText = (ctx, text, data) => {
    ctx.fillStyle = data.text_color;
    ctx.font = `${data.font_size}px Arial`;
    ctx.textAlign = data.alignment;

    const lines = breakTextIntoLines(text, data.max_characters_per_line);
    let offsetY = data.position.y;
    lines.forEach((line) => {
      ctx.fillText(line, data.position.x, offsetY);
      offsetY += data.font_size + 5;
    });
  };

  const drawCTA = (ctx, text, data) => {
    const wrapText = (text, wrapLength) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > wrapLength && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });

      lines.push(currentLine);
      return lines;
    };

    const ctaX = data.position.x;
    const ctaY = data.position.y;
    const ctaWidth = data.width || 200;
    const ctaHeight = data.height || 80;
    const cornerRadius = data.cornerRadius || 10;
    const textColor = data.text_color || 'white';
    const bgColor = data.backgroundColor || 'black';
    const padding = data.padding || 16;
    const wrapLength = data.wrapLength || 20;

    ctx.beginPath();
    ctx.moveTo(ctaX + cornerRadius, ctaY);
    ctx.arcTo(ctaX + ctaWidth, ctaY, ctaX + ctaWidth, ctaY + ctaHeight, cornerRadius);
    ctx.arcTo(ctaX + ctaWidth, ctaY + ctaHeight, ctaX, ctaY + ctaHeight, cornerRadius);
    ctx.arcTo(ctaX, ctaY + ctaHeight, ctaX, ctaY, cornerRadius);
    ctx.arcTo(ctaX, ctaY, ctaX + ctaWidth, ctaY, cornerRadius);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `${data.font_size || 30}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const wrappedText = wrapText(text, wrapLength);
    const lineHeight = ctx.measureText('M').width;

    const textY = ctaY + ctaHeight / 2 - (lineHeight * wrappedText.length) / 2;

    wrappedText.forEach((line, index) => {
      ctx.fillText(line, ctaX + ctaWidth / 2, textY + index * lineHeight + padding / 2);
    });
  };

  function getRandomColors() {
    const colors = [];
    for (let i = 0; i < MAX_PICKED_COLORS; i++) {
      colors.push('#' + Math.floor(Math.random() * 16777215).toString(16));
    }
    return colors;
  }

  const breakTextIntoLines = (text, maxCharactersPerLine) => {
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length === maxCharactersPerLine || i === text.length - 1) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    return lines;
  };

  return (
    <div className="flex">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          className="border border-gray-400"
          style={{ width: '400px', height: '400px' }}
        />
        
        <div className="options-container">
  <div className="ad-customization-container">
    <h2 className="ad-customization-heading">Ad Customization</h2>
    {/* File upload form */}
    <form className="form">
      <div className="file-upload-wrapper" style={{ background: 'linear-gradient(to top right, #bf7a6b 0%, #e6d8a7 100%)' }} data-text={fileName}>
        <input
          name="file-upload-field"
          type="file"
          className="file-upload-field"
          onChange={handleMaskImageUpload}
        />
      </div>
    </form>
    {/* Edit Contents */}
    <div className="edit-contents">
      {/* <h3>Edit Contents</h3> */}
      {/* Caption input */}
      <div className='textcont'>
        <h4>Edit Content</h4>
        <input
            type="text"
            value={caption}
            onChange={handleCaptionChange}
            style={{width: '90%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #dddddd',
              borderRadius: '5px',
              transition: 'border 0.3s ease'}}
            placeholder="Enter Caption"
            className="border border-gray-400 p-2 mb-2"
          />
      </div>
      {/* Call to action input */}
      <div className='captioncont'>
      <input
            type="text"
            value={callToAction}
            onChange={handleCallToActionChange}
            style={{width: '90%',
              padding: '10px',
              marginTop: '20px',
              border: '1px solid #dddddd',
              borderRadius: '5px',
              transition: 'border 0.3s ease'}}
            placeholder="Enter CTA Text"
            className="border border-gray-400 p-2 mb-2"
          />
      </div>
      {/* Color picker */}
      <div className="color-picker">
        <h3>Choose your color</h3>
        <div className="color-list">
          {/* Display last five picked colors */}
          {pickedColors.slice(0, 5).map((color, index) => (
            <button
              key={index}
              className="color-box"
              style={{ backgroundColor: color }}
              onClick={() => setBackgroundColor(color)}
            />
          ))}
          {/* Button with + icon */}
          <button className="color-picker-btn" onClick={handleColorPickerToggle}>+</button>
        </div>
        {showColorPicker && (
          <ChromePicker color={backgroundColor} onChange={handleBackgroundColorChange} />
        )}
      </div>
    </div>
  </div>
</div>
</div>

  );
};


export default CanvasEditor;
