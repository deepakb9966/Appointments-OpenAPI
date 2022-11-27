import { Api } from "../dist/models";
import * as t from "../dist/api/appointments/types";

export interface ServerEvents {
	"appointment:created": (todo: Api.AppointmentDto) => void;
	"appointment:updated": (todo: Api.AppointmentDto) => void;
	"appointment:deleted": (patientId: string, slotId: string) => void;
}

export interface ClientEvents {
	"appointment:getAll": (patientId: string,
		limit: number | null | undefined,
		direction: Api.DirectionParamEnum | undefined,
		sortByField: string | null | undefined, callback: (res: t.GetAppointmentsGetAllResponse) => void) => void;

	"appointment:create": (
		payload: Api.AppointmentDto | undefined,
		callback: (res: t.PostAppointmentsCreateResponse) => void
	) => void;

	"appointment:get": (id: string, callback: (res: t.GetAppointmentsGetResponse) => void) => void;

	"appointment:update": (
		payload: Api.AppointmentDto | undefined,
		callback: (res?: t.PutAppointmentsUpdateResponse) => void
	) => void;

	"appointment:delete": (patientId: string, slotId: string, callback: (res?: t.GetAppointmentsGetAllResponse) => void) => void;
}
