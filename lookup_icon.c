#include <stdio.h>
#include <gtk/gtk.h>
#include <stdlib.h>
#include <string.h>

GtkIconTheme *icon_theme_ptr;
GtkIconInfo  *icon_info_ptr;

const gchar  *icon_name;
const gchar  *icon_path;
gint          icon_size;

const gchar *
get_icon_path(const gchar *icon_name, gint icon_size)
{
	icon_info_ptr = gtk_icon_theme_lookup_icon (icon_theme_ptr, icon_name, icon_size, GTK_ICON_LOOKUP_GENERIC_FALLBACK);

	if ( icon_info_ptr ) {
		icon_path = gtk_icon_info_get_filename(icon_info_ptr);
		// printf("%s\n", icon_path);

		return icon_path;
	} else {
		// printf("Icon not found!\n");

		return NULL;
	}
}

int main(int argc, char **argv)
{
	// icon_name = argv[1];
	// icon_size = atoi(argv[2]);
	// printf("Ion server started!\n");
	// puts("Icon server started!");
	// fflush(stdout);

	// init Gtk
	// and load theme
	gtk_init(&argc, &argv);
	icon_theme_ptr = gtk_icon_theme_get_default();

	char *buffer      = NULL;
	char *exit_phrase = "EXIT\n";
	int read;
	unsigned int len;

	while(1){
		read = getline(&buffer, &len, stdin);

		if (-1 != read) {
			// puts(buffer);

			if ( strcmp (exit_phrase,buffer) == 0 ) {
				puts("Exiting.");
				fflush(stdout);
				return 0;
			}

			icon_name = strtok (buffer," ");
			// printf("Icon: %s\n", icon_name);


			icon_size = atoi( strtok (NULL," ") );
			// printf("Size: %i\n", icon_size);

			icon_path = get_icon_path(icon_name, icon_size);

			if ( icon_path == NULL ) {
				puts("Icon not found!");
				fflush(stdout);
				// printf("\n");
			} else {
				printf("%s\n", icon_path);
				fflush(stdout);
			}
		} else {
			puts("No line read...");
			fflush(stdout);
			return 0;
		}
	}

	// printf("Size read: %d\n Len: %d\n", read, len);
	free(buffer);
	return 0;
}