#include <windows.h>
#include <stdio.h>



int main(int argc, char * argv[]) {
    static const char * (CDECL *pwine_get_version)(void);
    static void (CDECL *pwine_get_host_version)(const char **sysname, const char **release);
    
    HMODULE hntdll = GetModuleHandle("ntdll.dll");
    if (!hntdll) {
        fprintf(stdout, "Not running on NT.\n");
        return 1;
    }
    
    pwine_get_version = (void *)GetProcAddress(hntdll, "wine_get_version");
    pwine_get_host_version = (void *)GetProcAddress(hntdll, "wine_get_host_version");
    
    if (pwine_get_version) {
        const char *sysname;
        const char *version;
        pwine_get_host_version(&sysname, &version);
        fprintf(stdout, "Running Wine %s under %s %s.\n", pwine_get_version(), sysname, version);
    } else {
        fprintf(stdout, "Running under Windows.\n");
        return 2;
    }
    
    return 0;
}
