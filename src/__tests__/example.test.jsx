import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

/**
 * EXEMPLO DE TESTES PARA COMPONENTE
 *
 * Instruções:
 * 1. Adaptar este arquivo para seus componentes
 * 2. Colocar testes em: src/__tests__/ ou src/components/__tests__/
 * 3. Rodar: npm run test
 * 4. Com UI: npm run test:ui
 * 5. Coverage: npm run test:coverage
 */

// Wrapper para Router (se necessário)
const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("Exemplo - Button Component", () => {
  it("deve renderizar botão com texto", () => {
    const ButtonComponent = () => <button>Click me</button>;
    render(<ButtonComponent />);

    const button = screen.getByText("Click me");
    expect(button).toBeInTheDocument();
  });

  it("deve ser clicável", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const ButtonComponent = () => (
      <button onClick={handleClick}>Click me</button>
    );

    render(<ButtonComponent />);

    const button = screen.getByText("Click me");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("deve ter classe CSS correta", () => {
    const ButtonComponent = () => (
      <button className="btn btn-primary">Click me</button>
    );

    render(<ButtonComponent />);

    const button = screen.getByText("Click me");
    expect(button).toHaveClass("btn");
    expect(button).toHaveClass("btn-primary");
  });
});

describe("Exemplo - Form Input", () => {
  it("deve atualizar valor ao digitar", async () => {
    const user = userEvent.setup();

    const FormComponent = () => {
      const [value, setValue] = React.useState("");
      return (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite aqui"
        />
      );
    };

    render(<FormComponent />);

    const input = screen.getByPlaceholderText("Digite aqui");
    await user.type(input, "Hello");

    expect(input).toHaveValue("Hello");
  });

  it("deve mostrar erro quando vazio", async () => {
    const user = userEvent.setup();
    const FormComponent = () => {
      const [error, setError] = React.useState("");

      const handleSubmit = () => {
        setError("Campo obrigatório");
      };

      return (
        <>
          <input placeholder="Nome" />
          <button onClick={handleSubmit}>Enviar</button>
          {error && <span role="alert">{error}</span>}
        </>
      );
    };

    render(<FormComponent />);

    const button = screen.getByText("Enviar");
    await user.click(button);

    expect(screen.getByRole("alert")).toHaveTextContent("Campo obrigatório");
  });
});

describe("Exemplo - Async Component", () => {
  it("deve carregar dados e exibir", async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        // Simulando fetch
        setTimeout(() => {
          setData({ name: "WG Almeida" });
          setLoading(false);
        }, 100);
      }, []);

      if (loading) return <div>Carregando...</div>;
      return <div>{data.name}</div>;
    };

    render(<AsyncComponent />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("WG Almeida")).toBeInTheDocument();
    });
  });
});

/**
 * PATTERNS COMUNS DE TESTE
 */

describe("Padrões Comuns", () => {
  // 1. Teste de visibilidade
  it("deve estar visível", () => {
    render(<div>Conteúdo</div>);
    expect(screen.getByText("Conteúdo")).toBeVisible();
  });

  // 2. Teste de disabled
  it("deve estar desabilitado", () => {
    render(<button disabled>Enviar</button>);
    expect(screen.getByText("Enviar")).toBeDisabled();
  });

  // 3. Teste de atributo
  it("deve ter atributo correto", () => {
    render(<input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  // 4. Teste de snapshot (use com cuidado!)
  it("deve renderizar corretamente (snapshot)", () => {
    const { container } = render(<div className="card">Conteúdo</div>);
    expect(container.firstChild).toMatchSnapshot();
  });

  // 5. Teste de acessibilidade
  it("deve ter label associada ao input", () => {
    render(
      <>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
      </>
    );

    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  // 6. Teste de lista
  it("deve renderizar lista de itens", () => {
    render(
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });
});

/**
 * BOAS PRÁTICAS
 */

/*
✅ Use screen.getByRole() quando possível (mais acessível)
   screen.getByRole('button', { name: 'Enviar' })

✅ Use screen.getByLabelText() para inputs
   screen.getByLabelText('Email')

✅ Use screen.getByPlaceholderText() como fallback
   screen.getByPlaceholderText('Digite...')

✅ Use screen.getByText() para conteúdo genérico
   screen.getByText('Clique aqui')

❌ Evite screen.getByTestId() (use apenas como último recurso)
   Prefira roles e labels

✅ Teste comportamento, não implementação
   ✅ await user.click(button)
   ❌ handleClick.toHaveBeenCalled() (teste resultado, não chamada)

✅ Espere por mudanças assíncronas
   await waitFor(() => expect(...).toBeInTheDocument())

✅ Teste acessibilidade
   Roles, labels, keyboard navigation, screen readers

✅ Use user events, não fireEvent
   await user.click(), não fireEvent.click()
*/
