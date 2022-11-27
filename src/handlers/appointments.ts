import { Server } from "socket.io";
import { ClientEvents, ServerEvents } from "../events";
import { ServiceImplementation } from "../impl";
import * as t from "../../dist/api/appointments/types";
import { Api } from "../../dist/models";

function appointmentsHandlers(
	io: Server<ClientEvents, ServerEvents>,
	implementation: ServiceImplementation
) {
	const { appointments } = implementation;
	return {
		async getAll(patientId: string,
			limit: number | null | undefined,
			direction: Api.DirectionParamEnum | undefined,
			sortByField: string | null | undefined, callback: (res: t.GetAppointmentsGetAllResponse) => void) {
			console.log("[socket] getAll requested");
			try {
				const res = await appointments.getAppointmentsGetAll(patientId, limit, direction, sortByField);
				callback(res);
			} catch (error) {
				console.error(error);
			}
		},

		async create(
			payload: Api.AppointmentDto | undefined,
			callback: (res: t.PostAppointmentsCreateResponse) => void
		) {
			console.log("[socket] create requested");
			try {
				const res = await appointments.postAppointmentsCreate(payload);
				callback(res);
				if (res.status === 201) {
					io.emit("appointment:created", res.body);
				}
			} catch (error) {
				console.error(error);
			}
		},
	};
}

export default appointmentsHandlers;
