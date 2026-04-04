import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { LazyImage, ResponsiveImage, useWebpSupport, preloadImage } from "@/utils/ImageOptimization";

// Mock IntersectionObserver como classe
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    // Simula entrada imediata na viewport
    this.callback([{ isIntersecting: true, target: element }]);
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.IntersectionObserver = MockIntersectionObserver;
  // Mock para evitar erro do jsdom ao chamar toDataURL
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/webp;base64,00");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LazyImage Component", () => {
  it("deve renderizar imagem com alt text", () => {
    render(<LazyImage src="/test.jpg" alt="Test image" />);
    expect(screen.getByAltText("Test image")).toBeInTheDocument();
  });

  it("deve aplicar classes CSS", () => {
    render(<LazyImage src="/test.jpg" alt="Test" className="w-full h-auto" />);
    const img = screen.getByAltText("Test");
    expect(img).toHaveClass("w-full");
    expect(img).toHaveClass("h-auto");
  });

  it("deve ter atributo loading=lazy", () => {
    render(<LazyImage src="/test.jpg" alt="Test" />);
    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("deve ter transicao de opacidade", () => {
    render(<LazyImage src="/test.jpg" alt="Test" />);
    const img = screen.getByAltText("Test");
    expect(img).toHaveClass("transition-opacity");
  });

  it("deve chamar onLoad quando imagem carregar", async () => {
    const handleLoad = vi.fn();
    render(<LazyImage src="/test.jpg" alt="Test" onLoad={handleLoad} />);

    const img = screen.getByAltText("Test");
    await act(async () => {
      img.dispatchEvent(new Event("load"));
    });

    expect(handleLoad).toHaveBeenCalled();
  });

  it("deve chamar onError quando imagem falhar", () => {
    const handleError = vi.fn();
    render(<LazyImage src="/invalid.jpg" alt="Test" onError={handleError} />);

    const img = screen.getByAltText("Test");
    img.dispatchEvent(new Event("error"));

    expect(handleError).toHaveBeenCalled();
  });
});

describe("ResponsiveImage Component", () => {
  it("deve renderizar elemento picture", () => {
    const { container } = render(
      <ResponsiveImage
        webpSrc="/test.webp"
        jpgSrc="/test.jpg"
        alt="Test image"
      />
    );
    expect(container.querySelector("picture")).toBeInTheDocument();
  });

  it("deve ter source para WebP", () => {
    const { container } = render(
      <ResponsiveImage
        webpSrc="/test.webp"
        jpgSrc="/test.jpg"
        alt="Test"
      />
    );

    const source = container.querySelector('source[type="image/webp"]');
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute("srcset", "/test.webp");
  });

  it("deve ter fallback JPG", () => {
    render(
      <ResponsiveImage
        webpSrc="/test.webp"
        jpgSrc="/test.jpg"
        alt="Test"
      />
    );

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("src", "/test.jpg");
  });

  it("deve aplicar width e height", () => {
    render(
      <ResponsiveImage
        webpSrc="/test.webp"
        jpgSrc="/test.jpg"
        alt="Test"
        width={800}
        height={600}
      />
    );

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("width", "800");
    expect(img).toHaveAttribute("height", "600");
  });

  it("deve ter loading=lazy", () => {
    render(
      <ResponsiveImage
        webpSrc="/test.webp"
        jpgSrc="/test.jpg"
        alt="Test"
      />
    );

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("loading", "lazy");
  });
});

describe("useWebpSupport Hook", () => {
  it("deve retornar boolean", () => {
    const TestComponent = () => {
      const supportsWebp = useWebpSupport();
      return <div data-testid="webp-support">{String(supportsWebp)}</div>;
    };

    render(<TestComponent />);
    const element = screen.getByTestId("webp-support");
    expect(["true", "false"]).toContain(element.textContent);
  });
});

describe("preloadImage Function", () => {
  it("deve adicionar link preload ao head", () => {
    preloadImage("/hero.jpg");

    const link = document.querySelector('link[rel="preload"][href="/hero.jpg"]');
    expect(link).toBeInTheDocument();
    // Verifica se o link foi criado com os atributos corretos
    expect(link.rel).toBe("preload");
    expect(link.href).toContain("/hero.jpg");
  });
});
