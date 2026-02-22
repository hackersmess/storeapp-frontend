import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator che controlla che la data/ora di fine siano successive a quelle di inizio
 * 
 * @param startDateControlName Nome del control per la data di inizio
 * @param startTimeControlName Nome del control per l'ora di inizio  
 * @param endDateControlName Nome del control per la data di fine
 * @param endTimeControlName Nome del control per l'ora di fine
 */
export function dateTimeRangeValidator(
	startDateControlName: string,
	startTimeControlName: string,
	endDateControlName: string,
	endTimeControlName: string
): ValidatorFn {
	return (formGroup: AbstractControl): ValidationErrors | null => {
		const startDate = formGroup.get(startDateControlName)?.value;
		const startTime = formGroup.get(startTimeControlName)?.value;
		const endDate = formGroup.get(endDateControlName)?.value;
		const endTime = formGroup.get(endTimeControlName)?.value;

		// Se uno dei campi è vuoto, non validare (lascia che required se ne occupi)
		if (!startDate || !startTime || !endDate || !endTime) {
			return null;
		}

		// Combina data e ora in DateTime
		const startDateTime = new Date(`${startDate}T${startTime}`);
		const endDateTime = new Date(`${endDate}T${endTime}`);

		// Controlla che end sia dopo start
		if (endDateTime <= startDateTime) {
			return {
				dateTimeRange: {
					message: 'Data e ora di fine devono essere successive a quelle di inizio'
				}
			};
		}

		return null;
	};
}

/**
 * Validator specifico per Trip con departureTime e arrivalTime
 */
export function tripDateTimeValidator(): ValidatorFn {
	return dateTimeRangeValidator('startDate', 'departureTime', 'endDate', 'arrivalTime');
}

/**
 * Validator specifico per Event con startTime e endTime
 */
export function eventDateTimeValidator(): ValidatorFn {
	return dateTimeRangeValidator('startDate', 'startTime', 'endDate', 'endTime');
}
