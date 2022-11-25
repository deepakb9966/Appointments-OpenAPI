import { AppointmentsApi } from "../../dist/api/appointments/types";
import { ApiImplementation } from "../../dist/types";
import { AppointmentsServiceImpl } from "./appointments";

export class ServiceImplementation implements ApiImplementation {
	// appointments: AppointmentsApi | undefined;
	appointments: AppointmentsApi = AppointmentsServiceImpl;
}
