import { Api } from "../../../dist/models";
import * as t from "../../../dist/api/appointments/types";
import * as v from "../../../dist/validation";
import { db } from "../../db";

export class appointmentsService {
	private readonly collectionName: string;

	constructor() {
		this.collectionName = "NEW-appointments";
		this.getAll = this.getAll.bind(this);
		this.get = this.get.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.delete = this.delete.bind(this);
	}

	/* *
	 ! Todo: Implement pagination for this service
	*/
	async getAll(
		limit: number | null | undefined,
		direction: Api.DirectionParamEnum | undefined,
		sortByField: string | null | undefined
	): Promise<t.GetAppointmentsGetAllResponse> {
		try {
			const appointmentsQuerySnap = await db.collection(`${this.collectionName}`).get();
			const appointments: Api.AppointmentDto[] = appointmentsQuerySnap.docs
				.map((doc) => doc.data())
				.map((json) => v.modelApiAppointmentDtoFromJson("patients", json));
			return {
				status: 200,
				body: {
					items: appointments,
					totalCount: appointments.length,
				},
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async get(id: string): Promise<t.GetAppointmentsGetResponse> {
		try {
			const appointmentsDocSnap = await db.doc(`${this.collectionName}/${id}`).get();
			if (!appointmentsDocSnap.exists) {
				throw new Error("no-appointments-found");
			}
			const appointments = v.modelApiAppointmentDtoFromJson("appointments", appointmentsDocSnap.data());
			return {
				status: 200,
				body: appointments,
			};
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("no-appointments-found")) {
				return {
					status: 404,
					body: {
						message: "No appointments found with given id",
					},
				};
			}
			throw error;
		}
	}

	async create(request: Api.AppointmentDto | undefined): Promise<t.PostAppointmentsCreateResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}

			if (!request.id) {
				throw new Error("no-Id-found");
			}

			const appointmentRef = db.collection(`${this.collectionName}`).doc(request.id);
			try {
				await this._checkUserExists(request.id);
			} catch (error: any) {
				if (error.toString().match("no-appointment-found")) {
					await appointmentRef.set({
						...request,
						isExist: true,
						id: appointmentRef.id,
						createdAt: new Date().toISOString(),
					});
					return {
						status: 201,
						body: request,
					};
				}
			}
			throw new Error("appointment-already-bokked");
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "No id found in request",
					},
				};
			}

			if (error.toString().match("appointment-already-bokked")) {
				return {
					status: 422,
					body: {
						message: "appointment already exists with given id",
					},
				};
			}
			throw error;
		}
	}

	async update(request: Api.AppointmentDto | undefined): Promise<t.PutAppointmentsUpdateResponse> {
		try {
			if (!request) {
				throw new Error("invalid-inputs");
			}

			if (!request.id) {
				throw new Error("no-uId-found");
			}

			const appointmentRef = db.collection(`${this.collectionName}`).doc(request.id);

			// checking whether patients exists or not
			const appointmentRes = await this._checkUserExists(request.id);
			await appointmentRef.update({
				...request,
				updatedAt: new Date().toISOString(),
			});
			return {
				status: 200,
				body: {
					...appointmentRes,
					...request,
				},
			};
		} catch (error: any) {
			console.error(error);
			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "Invalid request",
					},
				};
			}

			if (error.toString().match("invalid-inputs")) {
				return {
					status: 422,
					body: {
						message: "No id found in request",
					},
				};
			}

			throw error;
		}
	}

	async delete(id: string): Promise<t.DeleteAppointmentsDeleteResponse> {
		try {
			await this._checkUserExists(id);
			const appointmentRef = db.collection(`${this.collectionName}`).doc(id);
			await appointmentRef.delete({
				// isExist: false,
				// deletedAt: new Date().toISOString(),
			});
			return {
				status: 200,
				body: {
					...appointmentRef,
					message: "appointment deleted successfully",
				},
			};
		} catch (error: any) {
			console.error(error);
			if (error?.response?.status === 404) {
				return {
					status: 404,
					body: {
						
						message: "appointment already deleted or no appointment found",
					},
				};
			}
			throw error;
		}
	}

	private async _checkUserExists(id: string) {
		const response = await this.get(id);
		if (response.status === 404) {
			throw new Error("no-appointment-found");
		}
		return response.body;
	}
}
