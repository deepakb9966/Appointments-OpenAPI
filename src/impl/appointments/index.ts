import { appointmentsService } from "./impl";
import * as t from "../../../dist/api/appointments/types";

const service = new appointmentsService();

export const AppointmentsServiceImpl: t.AppointmentsApi = {
	postAppointmentsCreate: service.create,
	deleteAppointmentsDelete: service.delete,
	getAppointmentsGet: service.get,
	getAppointmentsGetAll: service.getAll,
	putAppointmentsUpdate: service.update,
};
