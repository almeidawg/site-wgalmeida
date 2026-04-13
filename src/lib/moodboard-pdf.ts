// PDF generation utilities for moodboard export
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PageSize {
  width: number;
  height: number;
}

export interface PDFExportOptions {
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
  quality: number;
  fileName: string;
}

/**
 * Convert HTML elements to PDF
 * @param elements Array of HTML elements (each represents a page)
 * @param options PDF export options
 */
export async function exportToPDF(
  elements: HTMLElement[],
  options: PDFExportOptions
): Promise<void> {
  const {
    pageSize,
    orientation,
    quality = 0.95,
    fileName = 'moodboard.pdf'
  } = options;

  // Create PDF document
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: [pageSize.width, pageSize.height]
  });

  // Convert each element to canvas and add to PDF
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // Add page (except for first page which is already created)
      if (i > 0) {
        pdf.addPage([pageSize.width, pageSize.height], orientation);
      }

      // Calculate dimensions to fit page
      const pdfWidth = pageSize.width;
      const pdfHeight = pageSize.height;

      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    } catch (error) {
      console.error(`Error converting page ${i + 1}:`, error);
    }
  }

  // Save PDF
  pdf.save(fileName);
}

/**
 * Generate PDF preview URL (for display before download)
 */
export async function generatePDFPreview(
  element: HTMLElement
): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating preview:', error);
    return null;
  }
}

/**
 * Calculate optimal page dimensions based on content
 */
export function calculatePageDimensions(
  baseSize: PageSize,
  contentAspectRatio?: number
): PageSize {
  if (!contentAspectRatio) {
    return baseSize;
  }

  const targetRatio = contentAspectRatio;
  const currentRatio = baseSize.width / baseSize.height;

  if (Math.abs(targetRatio - currentRatio) < 0.1) {
    return baseSize;
  }

  // Adjust dimensions to match content ratio
  if (targetRatio > currentRatio) {
    // Content is wider
    return {
      ...baseSize,
      height: baseSize.width / targetRatio
    };
  } else {
    // Content is taller
    return {
      ...baseSize,
      width: baseSize.height * targetRatio
    };
  }
}

/**
 * Batch load images before PDF generation
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  const promises = imageUrls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Failed to load image: ${url}`);
        resolve(); // Don't fail entire process
      };
      img.src = url;
    });
  });

  await Promise.all(promises);
}
