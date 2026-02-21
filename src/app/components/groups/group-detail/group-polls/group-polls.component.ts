import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlusCircle } from '@ng-icons/lucide';

@Component({
	selector: 'app-group-polls',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	providers: [provideIcons({ lucidePlusCircle })],
	templateUrl: './group-polls.component.html',
	styleUrls: ['./group-polls.component.scss'],
})
export class GroupPollsComponent { }
