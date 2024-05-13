import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from '@nextui-org/react';
import log from 'electron-log';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
  FaArrowCircleLeft,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaAsterisk,
  FaFastBackward,
  FaFastForward,
  FaHelicopter,
  FaHome,
  FaMinus,
  FaPause,
  FaPlus,
  FaUndo,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';

function Remote() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set(['Input']));

  const actualRokuInputs = {
    'HDMI 1': 'tvinput.hdmi1',
    'HDMI 2': 'tvinput.hdmi2',
    'HDMI 3': 'tvinput.hdmi3',
    'HDMI 4': 'tvinput.hdmi4',
    Tuner: 'tvinput.dtv',
    AV: 'button:InputAV1',
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const onNewDiscoveredRoku = useCallback((_event: Electron.IpcRendererEvent, arg1: unknown) => {
    log.log('Roku added to connectedRokus', arg1);
    // alert('Roku added to connectedRokus')
  }, []);
  const [value, setValue] = React.useState('');

  useEffect(() => {
    window.ipcRenderer.on('new-roku', onNewDiscoveredRoku);

    return () => {
      window.ipcRenderer.off('new-roku', onNewDiscoveredRoku);
    };
  }, []);
  useEffect(() => {
    // @ts-ignore
    window.ipcRenderer.send('launch', actualRokuInputs[selectedKeys[0]]);
  }, [selectedKeys]);
  return (
    <div
      className="left-0 mx-auto flex flex-col rounded-lg bg-gray-950 p-4 shadow-md outline-blue-950"
      style={{ width: '200px', height: '550px' }} // Set dimensions
    >
      {
        // Move button to the top right of the remote
      }
      {/* Top section - rounded rectangle */}
      <div
        className="grid grid-cols-3 items-center justify-items-center gap-4 rounded-t-lg bg-gray-900 p-2"
        style={{ gridTemplateRows: 'auto 1fr' }} // Adjust row heights
      >
        {/* <div className=" relative right-0 size-64">
        <Button isIconOnly aria-label="Power" onPress={() => window.ipcRenderer.send('buttonClicked', 'Power')}>
          <FaPowerOff size={30} />
        </Button>
      </div> */}
        <Button isIconOnly aria-label="Back" onPress={() => window.ipcRenderer.send('buttonClicked', 'Back')}>
          <FaArrowCircleLeft size={30} />
        </Button>
        <Button isIconOnly aria-label="Up" onPress={() => window.ipcRenderer.send('buttonClicked', 'Up')}>
          <FaArrowUp size={30} />
        </Button>
        <Button isIconOnly aria-label="Home" onPress={() => window.ipcRenderer.send('buttonClicked', 'Home')}>
          <FaHome size={30} />
        </Button>
        <Button isIconOnly aria-label="Left" onPress={() => window.ipcRenderer.send('buttonClicked', 'Left')}>
          <FaArrowLeft size={30} />
        </Button>
        <Button isIconOnly aria-label="Ok" onPress={() => window.ipcRenderer.send('buttonClicked', 'Select')}>
          <p className="text-large">
            <b>OK</b>
          </p>
        </Button>
        <Button isIconOnly aria-label="Right" onPress={() => window.ipcRenderer.send('buttonClicked', 'Right')}>
          <FaArrowRight size={30} />
        </Button>
        <Button
          isIconOnly
          aria-label="Rewind (30 seconds)"
          onPress={() => window.ipcRenderer.send('buttonClicked', 'Replay')}
        >
          <FaUndo size={30} />
        </Button>
        <Button isIconOnly aria-label="Down" onPress={() => window.ipcRenderer.send('buttonClicked', 'Down')}>
          <FaArrowDown size={30} />
        </Button>
        <Button isIconOnly aria-label="Asterisk" onPress={() => window.ipcRenderer.send('buttonClicked', 'Info')}>
          <FaAsterisk size={30} />
        </Button>
        <Button isIconOnly aria-label="Fast Backwards" onPress={() => window.ipcRenderer.send('buttonClicked', 'Rev')}>
          <FaFastBackward size={30} />
        </Button>
        <Button
          isIconOnly
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            window.ipcRenderer.send('buttonClicked', isPlaying ? 'Play' : 'Pause');
            togglePlay();
          }}
        >
          <FaPause size={30} />
        </Button>
        <Button
          isIconOnly
          aria-label="Fast Forward"
          onMouseDown={() => window.ipcRenderer.send('buttonClicked', 'Fwd')}
          onPress={() => window.ipcRenderer.send('buttonClicked', 'Fwd')}
        >
          <FaFastForward size={30} />
        </Button>
        <Button isIconOnly aria-label="Inputs">
          <FaHelicopter size={30} />
          <Suspense>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="shadow" className="capitalize">
                  {React.useMemo(() => [...selectedKeys].join(', ').replaceAll('_', ' '), [selectedKeys])}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="List of TV Inputs to select from"
                variant="flat"
                color={selectedKeys.size > 0 ? 'primary' : 'default'}
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={selectedKeys}
                onSelectionChange={newSelectedKeys => {
                  // @ts-ignore
                  setSelectedKeys(newSelectedKeys);
                  log.log('newSelectedKeys', [...newSelectedKeys]);
                  // @ts-ignore
                  window.ipcRenderer.send('launch', actualRokuInputs[[...newSelectedKeys][0]]);
                }}
                // disabledKeys={selectedKeys}
                itemClasses={{
                  base: [
                    'rounded-md',
                    'text-default-500',
                    'transition-opacity',
                    'data-[selectable=true]:focus:bg-default-50',
                    'data-[pressed=true]:opacity-70',
                    'data-[focus-visible=true]:ring-default-500',
                  ],
                }}
              >
                {Object.keys(actualRokuInputs).map(input => (
                  <DropdownItem key={input}>{input}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </Suspense>
        </Button>

        <Button isIconOnly aria-label="Minus" onPress={() => window.ipcRenderer.send('buttonClicked', 'channelDown')}>
          <FaMinus size={30} />
        </Button>
        <Button isIconOnly aria-label="Plus" onPress={() => window.ipcRenderer.send('buttonClicked', 'channelUp')}>
          <FaPlus size={30} />
        </Button>
        <Button
          isIconOnly
          // radius="full"
          // variant="light"
          aria-label="Volume Mute"
          onClick={() => {
            window.ipcRenderer.send('buttonClicked', 'VolumeMute');
          }}
        >
          <FaVolumeMute size={30} />
        </Button>
        <Button
          isIconOnly
          aria-label="Volume Down"
          onClick={() => {
            window.ipcRenderer.send('buttonClicked', 'VolumeDown');
          }}
        >
          <FaVolumeDown size={30} />
        </Button>
        <Button
          isIconOnly
          aria-label="Volume Up"
          onClick={() => {
            window.ipcRenderer.send('buttonClicked', 'VolumeUp');
          }}
        >
          <FaVolumeUp size={30} />
        </Button>
      </div>
      <Input
        label="Keyboard Mode"
        value={value}
        onKeyDown={e => {
          if (e.keyCode === 8) {
            window.ipcRenderer.send('type', 'backspace');
          }

          if (e.keyCode === 13) {
            window.ipcRenderer.send('type', 'enter');
          }
          // handle arrow keys
          if (e.keyCode === 37 && !e.ctrlKey) {
            window.ipcRenderer.send('type', 'left');
          } else if (e.keyCode === 37 && e.ctrlKey) {
            window.ipcRenderer.send('type', 'Rev');
          }
          if (e.keyCode === 38) {
            window.ipcRenderer.send('type', 'up');
          }
          if (e.keyCode === 39 && !e.ctrlKey) {
            window.ipcRenderer.send('type', 'right');
          } else if (e.keyCode === 39 && e.ctrlKey) {
            window.ipcRenderer.send('type', 'Fwd');
          }
          if (e.keyCode === 40) {
            window.ipcRenderer.send('type', 'down');
          }
          // Map certain things like CTRL+H to Home
          if (e.ctrlKey && e.keyCode === 72) {
            window.ipcRenderer.send('type', 'home');
          }
          if (e.ctrlKey && e.keyCode === 73) {
            window.ipcRenderer.send('type', 'info');
          }
          if (e.ctrlKey && e.keyCode === 76) {
            window.ipcRenderer.send('type', 'rev');
          }
          if (e.ctrlKey && e.keyCode === 79) {
            window.ipcRenderer.send('type', 'options');
          }
          if (e.ctrlKey && e.keyCode === 80) {
            window.ipcRenderer.send('type', 'play');
          }
          // add combo for ok
          if (e.ctrlKey && e.keyCode === 13) {
            window.ipcRenderer.send('type', 'select');
          }
          // yet another combo for ok
          if (e.ctrlKey && e.keyCode === 32) {
            window.ipcRenderer.send('type', 'select');
          }
          // Add combo for cancel
          if (e.ctrlKey && e.keyCode === 67) {
            window.ipcRenderer.send('type', 'back');
          }
          // Allow ctrl + z for back
          if (e.ctrlKey && e.keyCode === 90) {
            window.ipcRenderer.send('type', 'back');
          }
          // Allow ese for back
          if (e.keyCode === 27) {
            window.ipcRenderer.send('type', 'back');
          }
          // Allow ctrl + r for replay
          if (e.ctrlKey && e.keyCode === 82) {
            window.ipcRenderer.send('type', 'instantreplay');
          }
          // Allow ctrl + f for fast forward
          if (e.ctrlKey && e.keyCode === 70) {
            window.ipcRenderer.send('type', 'fwd');
          }
          // add functionality for volume with ctrl w for volume up ctrl s for volume down
          if (e.ctrlKey && e.keyCode === 87) {
            window.ipcRenderer.send('type', 'volumeUp');
          }
          if (e.ctrlKey && e.keyCode === 83) {
            window.ipcRenderer.send('type', 'volumeDown');
          }
        }}
        onValueChange={letter => {
          // This is way too dangerous to leave in even under debug
          // log.debug('value', value);
          window.ipcRenderer.send('type', letter);
        }}
        className="max-w-xs"
      />
      {/* Bottom section - iframe-like box of applications and channels */}
      <div
        className="grid grid-cols-3 items-center justify-items-center gap-4 rounded-t-lg bg-gray-900 p-2"
        // style={{ grid-template-rows: '1fr auto' }} // Adjust row heights
      >
        {}
      </div>
      {/* <div className="flex flex-col gap-2 w-full h-full max-w-md items-start justify-center"> */}
      {/* <Slider */}
      {/*    aria-label="Volume" */}
      {/*    size="lg" */}
      {/*    color={rokuMuted ? 'danger' : 'success'} */}
      {/*    value={rokuVolume} */}
      {/*    /* */}
      {/*    // @ts-ignore */}
      {/*    onChange={(value) => { */}
      {/*        // @ts-ignore */}
      {/*        setRokuVolume(value); */}

      {/*    } */}
      {/*    } */}
      {/*    showTooltip={true} */}
      {/*    startContent={ */}
      {/*        <Button */}
      {/*            isIconOnly */}
      {/*            radius="full" */}
      {/*            variant="light" */}
      {/*            aria-label="Volume Mute" */}
      {/*            onClick={() => { */}
      {/*                window.ipcRenderer.send('buttonClicked', 'VolumeMute') */}
      {/*                setRokuMuted(!rokuMuted) */}

      {/*            } */}
      {/*            } */}
      {/*        > */}
      {/*            {rokuVolume === 0 || rokuMuted ? <FaVolumeMute size={30}/> : <FaVolumeLow size={30}/>} */}
      {/*        </Button> */}
      {/*    } */}
      {/*    className="max-w-md" */}
      {/* /> */}
      {/* </div> */}
      {/* Bottom section - rounded rectangle with Netflix button */}
      {/* <div */}
      {/*    className="grid grid-cols-3 gap-4 items-center justify-items-center rounded-t-lg bg-gray-900 p-2" */}
      {/*    // style={{ grid-template-rows: '1fr auto' }} // Adjust row heights */}
      {/* > */}
      {/* <div className="grid grid-cols-2 gap-4 justify-items-center"> */}
      {/*    <Button isIconOnly aria-label="Volume Down"> */}
      {/*        <FaVolumeDown size={30}/> */}
      {/*    </Button> */}
      {/*    <Button isIconOnly aria-label="Volume Up"> */}
      {/*        <FaVolumeUp size={30}/> */}
      {/*    </Button> */}
      {/* </div> */}

      {/* Netflix button - absolute positioning */}
      {/* <Button */}
      {/*    className="absolute bottom-4 right-2 transform -translate-y-1/2 bg-red-300 hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-400 text-white shadow-md" */}
      {/*    size="lg" */}
      {/*    isIconOnly */}
      {/*    aria-label="Netflix" */}
      {/* > */}
      {/*    <FaNetflix size={28} /> */}
      {/* </Button> */}
      {/* </div> */}
    </div>
  );
}

export default Remote;
