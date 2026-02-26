import { fetchEmployeeRequestsFromApi } from "./employeeRequestApi";
import { loadEmployeeRequests, saveEmployeeRequests } from "./employeeRequestStore";

export async function loadEmployeeRequestsWithApiFallback(session) {
  try {
    const apiItems = await fetchEmployeeRequestsFromApi({ session });
    await saveEmployeeRequests(apiItems);
    return { items: apiItems, source: "api" };
  } catch {
    const localItems = await loadEmployeeRequests();
    return { items: localItems, source: "local" };
  }
}
