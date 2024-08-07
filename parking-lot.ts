type ParkingSpaceSize = 'small' | 'medium' | 'large';
type VehicleType = 'motorcycle' | 'car' | 'bus';
class ParkingSpace {
  id: number
  size: ParkingSpaceSize = 'small'
  vehicleId?: number
  constructor(id: number, size: ParkingSpaceSize) {
    this.id = id
    this.size = size
  }
}
class Vehicle  {
  id: number
  type: VehicleType
  constructor(id: number, type: VehicleType) {
    this.id = id
    this.type = type
  }
}

class ParkingLot {
  spaces: ParkingSpace[] = [];
  vehicles: Vehicle[] = [];
  constructor(spaces: ParkingSpace[], vehicles: Vehicle[]) {
    this.spaces = spaces
    this.vehicles = vehicles
  }
  getAvailableSpaces(size: ParkingSpaceSize): ParkingSpace[] {
    return this.spaces.filter(space => space.size === size && !space.vehicleId)
  }
  park(vehicle: Vehicle): string {
    // if motorcycle, find first small space, then medium, then large
    if (vehicle.type === 'motorcycle') {
      for (let size of ['small', 'medium', 'large'] as ParkingSpaceSize[]) {
        const [space] = this.getAvailableSpaces(size)
        if (space) {
          space.vehicleId = vehicle.id
          return ''
        }
      }
    }
    // if car, find first medium space, then large
    if (vehicle.type === 'car') {
      for (let size of ['medium', 'large'] as ParkingSpaceSize[]) {
        const [space] = this.getAvailableSpaces(size)
        if (space) {
          space.vehicleId = vehicle.id
          return ''
        }
      }
    }
    // if bus, find first large space (to use less spaces), then three medium spaces
    if (vehicle.type === 'bus') {
      const [space] = this.getAvailableSpaces('large')
        if (space) {
          space.vehicleId = vehicle.id
          return ''
        }
      const mediumSpaces = this.getAvailableSpaces('medium')
      if (mediumSpaces.length >= 3) {
        const firstThreeAvailable = mediumSpaces.slice(0, 3)
        firstThreeAvailable.forEach(space => space.vehicleId = vehicle.id)
        return ''
      }
    }
    return 'no space available'
  }
  remove(vehicle: Vehicle): string {
    const spaces = this.spaces.filter(space => space.vehicleId === vehicle.id)
    if (spaces.length) {
      spaces.forEach(s => s.vehicleId = undefined)
      return ''
    }
    return 'vehicle not found'
  }
}
