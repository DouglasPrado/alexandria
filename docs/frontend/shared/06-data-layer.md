# Data Layer

Define a camada de dados do frontend: como a aplicacao se comunica com o backend, o padrao de API client, estrategias de cache e os contratos de dados que garantem type-safety entre frontend e backend. Uma data layer bem definida isola o frontend de mudancas na API e centraliza tratamento de erros.

---

## API Client

> Existe um client centralizado para comunicacao com o backend?

Responsabilidades do API Client:
- Autenticacao (token injection via interceptor)
- Headers padrao (Content-Type, Accept, correlacao)
- Tratamento de erros (interceptors com mapeamento de status)
- Retry automatico (com backoff exponencial)
- Base URL configuration (por ambiente)

| Configuracao | Valor |
| --- | --- |
| Base URL | {{https://api.exemplo.com/v1}} |
| Timeout | {{30 segundos}} |
| Retry Policy | {{3 tentativas, backoff exponencial}} |
| Auth Header | {{Authorization: Bearer <token>}} |

**Localizacao:** `src/services/api-client.ts`

---

## Data Fetching

> Qual o padrao para buscar e mutar dados?

**Ferramenta:** {{TanStack Query / SWR / outro}}

Padrao de organizacao:
```
features/
  users/
    api/
      user-api.ts          # Funcoes de API (getUserById, updateUser)
    hooks/
      useUser.ts           # useQuery wrapper
      useUpdateUser.ts     # useMutation wrapper
    types/
      user.types.ts        # DTOs e interfaces
```

| Hook | Tipo | Endpoint | Cache Time |
| --- | --- | --- | --- |
| {{useUser}} | Query | {{GET /users/:id}} | {{5 min}} |
| {{useUsers}} | Query | {{GET /users}} | {{5 min}} |
| {{useUpdateUser}} | Mutation | {{PATCH /users/:id}} | — |
| {{useFiles}} | Query | {{GET /files}} | {{10 min}} |
| {{useUploadFile}} | Mutation | {{POST /files/upload}} | — |
| {{Outro hook}} | {{Tipo}} | {{Endpoint}} | {{Cache}} |

<!-- APPEND:hooks -->

<details>
<summary>Exemplo — Query + Mutation com TanStack Query</summary>

```typescript
// features/users/api/user-api.ts
export const userApi = {
  getById: (id: string) =>
    apiClient.get<UserDTO>(`/users/${id}`).then((res) => res.data),
  update: (id: string, data: UpdateUserDTO) =>
    apiClient.patch<UserDTO>(`/users/${id}`, data).then((res) => res.data),
};

// features/users/hooks/useUser.ts
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getById(id),
    staleTime: 5 * 60 * 1000,
  });
}

// features/users/hooks/useUpdateUser.ts
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserDTO) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}
```

</details>

---

## Contratos de API (DTOs)

> Como garantimos type-safety entre frontend e backend?

- Cada endpoint tem um DTO (Data Transfer Object) tipado
- Validacao em runtime com {{Zod / Yup / outro}}
- DTOs vivem em `features/xxx/types/`

| DTO | Campos Principais | Validacao |
| --- | --- | --- |
| {{UserDTO}} | {{id, name, email, role, createdAt}} | {{Zod schema com email validation}} |
| {{FileDTO}} | {{id, name, size, mimeType, url, uploadedAt}} | {{Zod schema com size limits}} |
| {{Outro DTO}} | {{Campos}} | {{Validacao}} |

<!-- APPEND:dtos -->

> Contratos podem ser gerados automaticamente a partir do OpenAPI/Swagger do backend, garantindo sincronizacao.

---

## BFF — Backend For Frontend

> O frontend usa uma camada BFF para agregar dados?

- [ ] Nao necessario (API direta)
- [ ] Sim — Next.js API Routes / Route Handlers
- [ ] Sim — Servico BFF separado

{{Se sim, descreva o papel do BFF: agregacao de multiplas APIs, autenticacao server-side, otimizacao de payload, transformacao de dados}}

| Rota BFF | APIs Agregadas | Proposito |
| --- | --- | --- |
| {{/api/dashboard}} | {{users + metrics + activity}} | {{Agregar dados do dashboard em uma unica chamada}} |
| {{/api/profile}} | {{users + billing + storage}} | {{Montar perfil completo do usuario}} |
| {{Outra rota}} | {{APIs}} | {{Proposito}} |

---

## Estrategia de Cache

> Como o cache e gerenciado em cada camada?

| Camada | Estrategia | TTL | Invalidacao |
| --- | --- | --- | --- |
| Browser Cache | {{Cache-Control headers}} | {{Definido pelo backend}} | {{ETag / Last-Modified}} |
| Query Cache (TanStack Query) | {{staleTime + gcTime}} | {{5-30 min conforme dominio}} | {{invalidateQueries apos mutations}} |
| Server Cache (Next.js) | {{ISR / SSG / revalidate}} | {{60s para paginas estaticas}} | {{revalidatePath / revalidateTag}} |
| CDN | {{Assets estaticos}} | {{1 ano (com hash no filename)}} | {{Deploy com novos hashes}} |

<!-- APPEND:cache -->

> Estrategia geral: dados frequentemente atualizados usam staleTime curto. Dados estaticos usam cache longo com invalidacao explicita.

> Gerenciamento de estado e cache: (ver 05-estado.md)
