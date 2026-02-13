import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-confirm-dialog',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
	@Input() show = false;
	@Input() title = 'Conferma azione';
	@Input() message = 'Sei sicuro di voler procedere?';
	@Input() confirmText = 'Conferma';
	@Input() cancelText = 'Annulla';
	@Input() confirmButtonClass = 'btn-danger';
	@Input() loading = false;

	@Output() confirm = new EventEmitter<void>();
	@Output() cancel = new EventEmitter<void>();

	onConfirm() {
		if (!this.loading) {
			this.confirm.emit();
		}
	}

	onCancel() {
		if (!this.loading) {
			this.cancel.emit();
		}
	}

	onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !this.loading) {
			this.onCancel();
		}
	}
}
