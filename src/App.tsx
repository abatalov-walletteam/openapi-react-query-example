import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./openapi.types";
import type { components } from "./openapi.types";

type Pet = components["schemas"]["Pet"];

const fetchClient = createFetchClient<paths>({
  baseUrl: "https://petstore3.swagger.io/api/v3",
});

const $api = createClient<paths>(fetchClient);

type PetStatus = NonNullable<Pet["status"]>;

interface PetsFilter {
  status: PetStatus;
}

function PetListFilter({
  petsFilter,
  onCreate,
  setPetsFilter,
}: {
  petsFilter: PetsFilter;
  onCreate: (petStatusToCreate: PetStatus) => void;
  setPetsFilter: (petsFilter: PetsFilter) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const status = new FormData(event.currentTarget).get("status");
        if (isPetStatus(status)) {
          onCreate(status);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="status" style={{ color: "#666" }}>
          Select status:{" "}
        </label>
        <StatusesSelect
          name="status"
          value={petsFilter.status}
          onChange={(event) => {
            const status = event.target.value as PetStatus;
            setPetsFilter({
              ...petsFilter,
              status,
            });
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        />
      </div>
      <button
        type="submit"
        style={{
          padding: "8px 16px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Add pet
      </button>
    </form>
  );
}

function PetList({
  petsFilter,
  onEdit,
}: {
  petsFilter: PetsFilter;
  onEdit: (petId: number) => void;
}) {
  const { data, error, isLoading } = $api.useQuery("get", "/pet/findByStatus", {
    params: {
      query: { status: petsFilter.status },
    },
  });

  if (error)
    return (
      <div
        style={{
          color: "red",
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#fee",
        }}
      >
        Error loading data
      </div>
    );
  if (isLoading)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        padding: "20px",
        width: "100%",
      }}
    >
      {data?.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          onEdit={() => {
            if (!pet.id) throw new Error("pet.id not found");
            onEdit(pet.id);
          }}
        />
      ))}
    </div>
  );
}

function PetCard({ pet, onEdit }: { pet: Pet; onEdit: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={pet.id}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "20px",
        position: "relative",
        wordBreak: "break-word",
        backgroundColor: "#fff",
        boxShadow: isHovered
          ? "0 4px 8px rgba(0,0,0,0.1)"
          : "0 2px 4px rgba(0,0,0,0.05)",
        transform: isHovered ? "translateY(-2px)" : "none",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <dl style={{ margin: 0 }}>
        <dt
          style={{ color: "#666", fontSize: "0.875rem", marginBottom: "4px" }}
        >
          Name:
        </dt>
        <dd
          style={{
            margin: "0 0 12px 0",
            fontSize: "1.125rem",
            fontWeight: "bold",
          }}
        >
          {pet.name}
        </dd>
        <dt
          style={{ color: "#666", fontSize: "0.875rem", marginBottom: "4px" }}
        >
          ID:
        </dt>
        <dd style={{ margin: "0 0 12px 0" }}>{pet.id}</dd>
        <dt
          style={{ color: "#666", fontSize: "0.875rem", marginBottom: "4px" }}
        >
          Category:
        </dt>
        <dd style={{ margin: "0 0 12px 0" }}>
          {pet.category?.name || (
            <code
              style={{
                backgroundColor: "#f5f5f5",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              not specified
            </code>
          )}
        </dd>
        <dt
          style={{ color: "#666", fontSize: "0.875rem", marginBottom: "4px" }}
        >
          Status:
        </dt>
        <dd
          style={{
            margin: "0",
            display: "inline-block",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor:
              pet.status === "available"
                ? "#e6f4ea"
                : pet.status === "pending"
                  ? "#fff3e0"
                  : "#feebe6",
            color:
              pet.status === "available"
                ? "#1e4620"
                : pet.status === "pending"
                  ? "#994f00"
                  : "#ac1900",
          }}
        >
          {pet.status}
        </dd>
      </dl>

      <button
        style={{
          position: "absolute",
          right: "12px",
          top: "12px",
          padding: "8px 16px",
          backgroundColor: isHovered ? "#1565c0" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.875rem",
          transition: "background-color 0.2s",
        }}
        onClick={(event) => {
          event.preventDefault();
          if (!pet.id) throw new Error("pet.id not found");
          onEdit();
        }}
      >
        Edit
      </button>
    </div>
  );
}

function PetCreateForm({
  status,
  onCreate,
  onReset,
}: {
  status: PetStatus;
  onCreate: () => void;
  onReset: () => void;
}) {
  const { mutate, error, isPending } = $api.useMutation("post", "/pet", {
    onSuccess: () => {
      onCreate();
    },
  });

  return (
    <PetForm
      pet={{ status }}
      disabled={isPending}
      formMode="create"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get("name");
        if (typeof name !== "string") return;

        mutate({
          body: {
            status,
            name,
            photoUrls: [],
          },
        });
      }}
      onReset={(event) => {
        event.preventDefault();
        onReset();
      }}
      id="createPetForm"
      style={{
        display: "flex",
        flexFlow: "column",
        gap: 10,
        maxWidth: 300,
      }}
    >
      {!!error && <div style={{ color: "red" }}>Error creating pet</div>}
    </PetForm>
  );
}

function PetUpdateForm({
  petId,
  onUpdate,
  onReset,
}: {
  petId: number;
  onUpdate: () => void;
  onReset: () => void;
}) {
  const queryClient = useQueryClient();

  // Creating query options for reuse
  const queryOptions = $api.queryOptions("get", "/pet/{petId}", {
    params: {
      path: { petId },
    },
  });

  // Need to explicitly specify the data type for cache operations
  type PetQueryResult = Awaited<ReturnType<typeof queryOptions.queryFn>>;

  const {
    data: pet,
    error,
    isLoading,
  } = $api.useQuery("get", "/pet/{petId}", {
    params: {
      path: { petId },
    },
  });

  const { mutate, isPending } = $api.useMutation("put", "/pet", {
    async onMutate(variables) {
      // Canceling current queries to avoid race conditions
      await queryClient.cancelQueries(queryOptions);

      // Saving previous state
      const prevPet = queryClient.getQueryData<PetQueryResult>(
        queryOptions.queryKey,
      );

      // Optimistically update UI
      queryClient.setQueryData<PetQueryResult>(
        queryOptions.queryKey,
        (oldData) => ({
          ...oldData,
          ...variables.body,
        }),
      );

      return prevPet;
    },
    onError(_error, _variables, context) {
      // `context` is always `unknown` due to library implementation limitations 😞
      const prevPet = context as PetQueryResult | undefined;

      // If there's an error, revert to the previous state
      if (prevPet) {
        queryClient.setQueryData<PetQueryResult>(
          queryOptions.queryKey,
          prevPet,
        );
      }
    },
    async onSuccess(updatedPet) {
      // Update cache after successful mutation
      queryClient.setQueryData<PetQueryResult>(
        queryOptions.queryKey,
        updatedPet,
      );

      // Invalidate related queries
      await queryClient.invalidateQueries(queryOptions);
      await queryClient.invalidateQueries({
        queryKey: $api.queryOptions("get", "/pet/findByStatus").queryKey,
      });

      onUpdate();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>Error loading data</div>;
  if (!pet) return <div>Pet not found</div>;

  return (
    <PetForm
      pet={pet}
      disabled={isPending}
      formMode="update"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get("name");
        const status = formData.get("status");
        if (typeof name !== "string" || !isPetStatus(status)) return;

        mutate({
          body: {
            id: pet.id,
            name,
            status,
            photoUrls: pet.photoUrls || [],
          },
        });
      }}
      onReset={(event) => {
        event.preventDefault();
        onReset();
      }}
      id="updatePetForm"
      style={{
        display: "flex",
        flexFlow: "column",
        gap: 10,
        maxWidth: 300,
      }}
    />
  );
}

function PetForm({
  formMode,
  pet,
  disabled,
  children,
  ...restProps
}: {
  formMode: "create" | "update";
  pet: Partial<Pet>;
  disabled: boolean;
} & React.ComponentProps<"form">) {
  return (
    <form {...restProps}>
      {children}

      {formMode === "update" ? (
        <label
          style={{ display: "block", marginBottom: "20px", color: "#666" }}
        >
          Pet ID: <strong style={{ color: "#000" }}>{pet?.id}</strong>
        </label>
      ) : (
        <label
          style={{
            display: "block",
            marginBottom: "20px",
            fontSize: "1.25rem",
            color: "#1976d2",
          }}
        >
          Create new pet
        </label>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="name"
          style={{ display: "block", marginBottom: "8px", color: "#666" }}
        >
          Name:
        </label>
        <input
          readOnly={disabled}
          aria-busy={disabled}
          type="text"
          id="name"
          name="name"
          defaultValue={pet?.name}
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            fontSize: "1rem",
            backgroundColor: disabled ? "#f5f5f5" : "#fff",
          }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="status"
          style={{ display: "block", marginBottom: "8px", color: "#666" }}
        >
          Status:
        </label>
        <StatusesSelect
          id="status"
          name="status"
          defaultValue={pet?.status}
          aria-busy={disabled}
          disabled={disabled}
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            fontSize: "1rem",
            backgroundColor: disabled ? "#f5f5f5" : "#fff",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          type="reset"
          disabled={disabled}
          style={{
            padding: "8px 16px",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            backgroundColor: "#fff",
            color: "#666",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={disabled}
          style={{
            padding: "8px 16px",
            backgroundColor: disabled ? "#90caf9" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
          }}
        >
          {formMode === "update" ? "Update pet" : "Create pet"}
        </button>
      </div>
    </form>
  );
}

const StatusesSelect = (
  props: Omit<React.ComponentProps<"select">, "children">,
) => {
  return (
    <select {...props}>
      <option value="available">Available</option>
      <option value="pending">Pending</option>
      <option value="sold">Sold</option>
    </select>
  );
};

function isPetStatus(value: unknown): value is PetStatus {
  return (
    typeof value === "string" &&
    ["available", "pending", "sold"].includes(value)
  );
}

function AppComponent() {
  const [petIdToEdit, setPetIdToEdit] = useState<number | null>(null);
  const [petStatusToCreate, setPetStatusToCreate] = useState<PetStatus | null>(
    null,
  );
  const [petsFilter, setPetsFilter] = useState<PetsFilter>({
    status: "available",
  });

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        gap: 20,
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {!petIdToEdit && !petStatusToCreate && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <PetListFilter
            onCreate={setPetStatusToCreate}
            petsFilter={petsFilter}
            setPetsFilter={setPetsFilter}
          />
        </div>
      )}

      {petIdToEdit && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <PetUpdateForm
            petId={petIdToEdit}
            onUpdate={() => setPetIdToEdit(null)}
            onReset={() => setPetIdToEdit(null)}
          />
        </div>
      )}

      {!petIdToEdit && petStatusToCreate && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <PetCreateForm
            status={petStatusToCreate}
            onCreate={() => setPetStatusToCreate(null)}
            onReset={() => setPetStatusToCreate(null)}
          />
        </div>
      )}

      {!petIdToEdit && !petStatusToCreate && (
        <PetList petsFilter={petsFilter} onEdit={setPetIdToEdit} />
      )}
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppComponent />
    </QueryClientProvider>
  );
}
