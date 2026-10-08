import { ref } from "vue";

// Composable untuk state input form.
// Pemakaian: const [name, onNameChange, resetName] = useInput("");
export function useInput(defaultValue = "") {
  const value = ref(defaultValue);

  const onChange = (event) => {
    value.value = event && event.target ? event.target.value : event;
  };

  const reset = () => {
    value.value = defaultValue;
  };

  return [value, onChange, reset];
}